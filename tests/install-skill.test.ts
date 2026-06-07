import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallSkillError, installSkillCommand } from '../src/commands/install-skill.js';

const fsMocks = vi.hoisted(() => ({
  access: vi.fn(),
  cp: vi.fn(),
  lstat: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  readlink: vi.fn(),
  rm: vi.fn(),
  symlink: vi.fn(),
}));

vi.mock('node:fs/promises', () => fsMocks);

const ENOENT = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });

const TARGET = '/tmp/x';

/** 기본: target 자체는 존재 / target 하위는 fresh (없음) / source(SKILLS_DIR) 등은 존재 */
function defaultAccess(p: unknown): Promise<void> {
  const path = String(p);
  if (path === TARGET) return Promise.resolve();
  if (path.startsWith(TARGET + '/')) return Promise.reject(ENOENT);
  return Promise.resolve();
}

describe('installSkillCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fsMocks.access.mockImplementation(defaultAccess);
    fsMocks.cp.mockResolvedValue(undefined);
    fsMocks.mkdir.mockResolvedValue(undefined);
    fsMocks.readlink.mockResolvedValue('../.agents/skills');
    fsMocks.rm.mockResolvedValue(undefined);
    fsMocks.symlink.mockResolvedValue(undefined);
    fsMocks.lstat.mockRejectedValue(ENOENT);
    fsMocks.readdir.mockResolvedValue([
      { name: 'ui-build-components', isDirectory: () => true },
      { name: 'ui-design-pages', isDirectory: () => true },
    ]);
  });

  it('이름 없고 --all 도 없으면 InstallSkillError', async () => {
    await expect(installSkillCommand(undefined, { target: '/tmp/x' })).rejects.toThrow(
      /이름이 필요/,
    );
  });

  it('알 수 없는 SKILL → InstallSkillError + 사용 가능 목록 안내', async () => {
    fsMocks.access.mockImplementation((p) => {
      const path = String(p);
      if (path.includes('skills/missing-x/SKILL.md')) return Promise.reject(ENOENT);
      return defaultAccess(p);
    });
    const err = await installSkillCommand('missing-x', { target: TARGET }).catch((e) => e);
    expect(err).toBeInstanceOf(InstallSkillError);
    expect(String(err.message)).toMatch(/SKILL 없음/);
    expect(String(err.message)).toMatch(/사용 가능/);
  });

  it('.agents/skills/<name> 카피 + .claude/skills 심링크 생성', async () => {
    await installSkillCommand('ui-build-components', { target: '/tmp/x' });
    expect(fsMocks.cp).toHaveBeenCalledOnce();
    const [, dst] = fsMocks.cp.mock.calls[0] as [string, string];
    expect(String(dst)).toContain('.agents/skills/ui-build-components');
    expect(fsMocks.symlink).toHaveBeenCalledOnce();
    const [linkTarget, linkPath] = fsMocks.symlink.mock.calls[0] as [string, string];
    expect(linkTarget).toBe('../.agents/skills');
    expect(String(linkPath)).toMatch(/\.claude\/skills$/);
  });

  it('.codex/skills/ 는 만들지 않음 (Codex native scan)', async () => {
    await installSkillCommand('ui-build-components', { target: '/tmp/x' });
    const allTargets = [...fsMocks.cp.mock.calls, ...fsMocks.symlink.mock.calls]
      .map((c) => String(c[1] ?? c[0]))
      .join(' ');
    expect(allTargets).not.toMatch(/\.codex\/skills/);
  });

  it('기존 .agents/skills/<name> + --force 없음 → skip + 심링크는 그대로 보장', async () => {
    fsMocks.access.mockImplementation((p) => {
      // .agents/skills/ui-build-components 가 이미 있다고 가정 (target 하위지만 존재)
      if (String(p).includes('.agents/skills/ui-build-components')) return Promise.resolve();
      return defaultAccess(p);
    });
    await installSkillCommand('ui-build-components', { target: TARGET });
    expect(fsMocks.cp).not.toHaveBeenCalled();
    // symlink 는 새로 만들지 (없으니까) — ensureClaudeLink 가 호출됨
    expect(fsMocks.symlink).toHaveBeenCalledOnce();
  });

  it('--force → 덮어쓰기 (rm + cp)', async () => {
    fsMocks.access.mockImplementation((p) => {
      if (String(p).includes('.agents/skills/ui-build-components')) return Promise.resolve();
      return defaultAccess(p);
    });
    await installSkillCommand('ui-build-components', { target: TARGET, force: true });
    expect(fsMocks.rm).toHaveBeenCalledOnce();
    expect(fsMocks.cp).toHaveBeenCalledOnce();
  });

  it('.claude/skills 가 올바른 심링크면 noop', async () => {
    fsMocks.lstat.mockResolvedValue({ isSymbolicLink: () => true });
    fsMocks.readlink.mockResolvedValue('../.agents/skills');
    await installSkillCommand('ui-build-components', { target: '/tmp/x' });
    expect(fsMocks.symlink).not.toHaveBeenCalled();
  });

  it('.claude/skills 가 실 디렉토리면 InstallSkillError + 마이그레이션 안내', async () => {
    fsMocks.lstat.mockResolvedValue({ isSymbolicLink: () => false });
    const err = await installSkillCommand('ui-build-components', { target: '/tmp/x' }).catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(InstallSkillError);
    expect(String(err.message)).toMatch(/수동 정리/);
    expect(fsMocks.symlink).not.toHaveBeenCalled();
  });

  it('.claude/skills 가 다른 곳 가리키는 심링크면 InstallSkillError', async () => {
    fsMocks.lstat.mockResolvedValue({ isSymbolicLink: () => true });
    fsMocks.readlink.mockResolvedValue('../somewhere/else');
    const err = await installSkillCommand('ui-build-components', { target: '/tmp/x' }).catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(InstallSkillError);
    expect(fsMocks.symlink).not.toHaveBeenCalled();
  });

  it('--all → readdir 결과 전부 설치', async () => {
    await installSkillCommand(undefined, { target: '/tmp/x', all: true });
    expect(fsMocks.cp).toHaveBeenCalledTimes(2);
    expect(fsMocks.symlink).toHaveBeenCalledOnce(); // 심링크는 한 번
  });

  it('--list → 출력만, 파일 동작 없음', async () => {
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((s) => {
      logs.push(String(s));
    });
    await installSkillCommand(undefined, { list: true });
    spy.mockRestore();
    expect(logs.some((l) => l.includes('ui-build-components'))).toBe(true);
    expect(fsMocks.cp).not.toHaveBeenCalled();
    expect(fsMocks.symlink).not.toHaveBeenCalled();
  });
});
