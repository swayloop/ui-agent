import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokensError, tokensCommand } from '../src/commands/tokens.js';

const { spawnMock, accessMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
  accessMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({ spawn: spawnMock }));
vi.mock('node:fs/promises', () => ({ access: accessMock }));

function exitWith(code = 0): () => EventEmitter {
  return () => {
    const ee = new EventEmitter();
    setImmediate(() => ee.emit('exit', code));
    return ee;
  };
}

/** access() default: 모든 경로 OK (.git, node_modules/@google/design.md, DESIGN.md) */
function makeAccess(missing: string[] = []) {
  return async (p: unknown) => {
    const path = String(p);
    if (missing.some((m) => path.includes(m))) {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      throw err;
    }
  };
}

describe('tokensCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accessMock.mockImplementation(makeAccess([]));
    spawnMock.mockImplementation(exitWith(0));
  });

  it('@google/design.md 미설치 시 TokensError + 설치 안내', async () => {
    accessMock.mockImplementation(makeAccess(['node_modules/@google/design.md']));
    await expect(tokensCommand({})).rejects.toBeInstanceOf(TokensError);
    await expect(tokensCommand({})).rejects.toThrow(/설치/);
  });

  it('입력 DESIGN.md 부재 시 TokensError', async () => {
    accessMock.mockImplementation(makeAccess(['DESIGN.md']));
    await expect(tokensCommand({})).rejects.toThrow(/입력 파일 없음/);
  });

  it('기본 경로로 export dtcg 호출', async () => {
    await tokensCommand({});
    expect(spawnMock).toHaveBeenCalledOnce();
    const [cmd, args] = spawnMock.mock.calls[0] as [string, string[]];
    expect(cmd).toBe('npx');
    expect(args[0]).toBe('@google/design.md');
    expect(args[1]).toBe('export');
    expect(args[2]).toBe('dtcg');
    expect(args).toContain('--in');
    expect(args).toContain('--out');
    expect(args.some((a) => a.endsWith('design/DESIGN.md'))).toBe(true);
    expect(args.some((a) => a.endsWith('design/tokens.json'))).toBe(true);
  });

  it('--in / --out 옵션 인자 매핑', async () => {
    await tokensCommand({ in: 'custom/D.md', out: 'custom/t.json' });
    const [, args] = spawnMock.mock.calls[0] as [string, string[]];
    expect(args.some((a) => a.endsWith('custom/D.md'))).toBe(true);
    expect(args.some((a) => a.endsWith('custom/t.json'))).toBe(true);
  });

  it('--lint 옵션 시 lint 먼저 호출 후 export', async () => {
    spawnMock.mockImplementationOnce(exitWith(0)).mockImplementationOnce(exitWith(0));
    await tokensCommand({ lint: true });
    expect(spawnMock).toHaveBeenCalledTimes(2);
    const lintArgs = spawnMock.mock.calls[0]![1] as string[];
    const exportArgs = spawnMock.mock.calls[1]![1] as string[];
    expect(lintArgs[0]).toBe('@google/design.md');
    expect(lintArgs[1]).toBe('lint');
    expect(exportArgs[1]).toBe('export');
  });

  it('lint 실패 시 export 안 부르고 exit code 전파', async () => {
    spawnMock.mockImplementationOnce(exitWith(2));
    const err = await tokensCommand({ lint: true }).catch((e) => e);
    expect(err).toBeInstanceOf(TokensError);
    expect((err as TokensError).exitCode).toBe(2);
    expect(spawnMock).toHaveBeenCalledOnce();
  });

  it('export 실패 시 exit code 전파', async () => {
    spawnMock.mockImplementationOnce(exitWith(3));
    const err = await tokensCommand({}).catch((e) => e);
    expect(err).toBeInstanceOf(TokensError);
    expect((err as TokensError).exitCode).toBe(3);
    expect((err as TokensError).message).toMatch(/export dtcg 실패/);
  });
});
