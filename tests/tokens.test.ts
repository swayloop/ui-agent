import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokensError, tokensCommand } from '../src/commands/tokens.js';

const { spawnMock, accessMock, mkdirMock, writeFileMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
  accessMock: vi.fn(),
  mkdirMock: vi.fn(),
  writeFileMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({ spawn: spawnMock }));
vi.mock('node:fs/promises', () => ({
  access: accessMock,
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}));

type MockProc = EventEmitter & { stdout?: EventEmitter };

function exitWith(code = 0, stdout = '{}'): () => MockProc {
  return () => {
    const proc = new EventEmitter() as MockProc;
    proc.stdout = new EventEmitter();
    setImmediate(() => {
      if (stdout) proc.stdout!.emit('data', Buffer.from(stdout));
      proc.emit('exit', code);
    });
    return proc;
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
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
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

  it('기본 경로로 export 호출 (v0.2.0 시그니처: FILE positional + --format dtcg)', async () => {
    await tokensCommand({});
    expect(spawnMock).toHaveBeenCalledOnce();
    const [cmd, args] = spawnMock.mock.calls[0] as [string, string[]];
    expect(cmd).toBe('npx');
    expect(args[0]).toBe('@google/design.md');
    expect(args[1]).toBe('export');
    // FILE 은 positional (args[2])
    expect(args[2]?.endsWith('design/DESIGN.md')).toBe(true);
    // --format dtcg
    const fmtIdx = args.indexOf('--format');
    expect(fmtIdx).toBeGreaterThan(-1);
    expect(args[fmtIdx + 1]).toBe('dtcg');
    // v0.1.x 잔재 없어야 함 (export dtcg ... --in X --out Y)
    expect(args).not.toContain('--in');
    expect(args).not.toContain('--out');
    // stdout → 파일 저장
    expect(writeFileMock).toHaveBeenCalledOnce();
    const [outPath] = writeFileMock.mock.calls[0]!;
    expect(String(outPath).endsWith('design/tokens.json')).toBe(true);
  });

  it('--in / --out 옵션 인자 매핑 (in→positional, out→writeFile)', async () => {
    await tokensCommand({ in: 'custom/D.md', out: 'custom/t.json' });
    const [, args] = spawnMock.mock.calls[0] as [string, string[]];
    expect(args[2]?.endsWith('custom/D.md')).toBe(true);
    const [outPath] = writeFileMock.mock.calls[0]!;
    expect(String(outPath).endsWith('custom/t.json')).toBe(true);
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
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it('export 실패 시 exit code 전파 + 파일 미생성', async () => {
    spawnMock.mockImplementationOnce(exitWith(3));
    const err = await tokensCommand({}).catch((e) => e);
    expect(err).toBeInstanceOf(TokensError);
    expect((err as TokensError).exitCode).toBe(3);
    expect((err as TokensError).message).toMatch(/export 실패/);
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it('export 성공 시 stdout 내용을 그대로 저장', async () => {
    const payload = '{"$schema":"dtcg","color":{}}';
    spawnMock.mockImplementationOnce(exitWith(0, payload));
    await tokensCommand({});
    expect(writeFileMock).toHaveBeenCalledOnce();
    const [, body] = writeFileMock.mock.calls[0]!;
    expect((body as Buffer).toString()).toBe(payload);
  });

  it('--format 미지정 시 dtcg (호환성)', async () => {
    await tokensCommand({});
    const [, args] = spawnMock.mock.calls[0] as [string, string[]];
    const fmtIdx = args.indexOf('--format');
    expect(args[fmtIdx + 1]).toBe('dtcg');
  });

  it('--format css-tailwind passthrough', async () => {
    await tokensCommand({ format: 'css-tailwind', out: 'src/styles/theme.css' });
    const [, args] = spawnMock.mock.calls[0] as [string, string[]];
    const fmtIdx = args.indexOf('--format');
    expect(args[fmtIdx + 1]).toBe('css-tailwind');
    const [outPath] = writeFileMock.mock.calls[0]!;
    expect(String(outPath).endsWith('src/styles/theme.css')).toBe(true);
  });

  it('미지의 --format 도 그대로 passthrough (값 검증 안 함)', async () => {
    await tokensCommand({ format: 'some-future-fmt' });
    const [, args] = spawnMock.mock.calls[0] as [string, string[]];
    const fmtIdx = args.indexOf('--format');
    expect(args[fmtIdx + 1]).toBe('some-future-fmt');
  });
});
