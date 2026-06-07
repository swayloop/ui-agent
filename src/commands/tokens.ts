import { spawn } from 'node:child_process';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import chalk from 'chalk';

export interface TokensOptions {
  in?: string;
  out?: string;
  lint?: boolean;
}

const PACKAGE = '@google/design.md';
const DEFAULT_IN = 'design/DESIGN.md';
const DEFAULT_OUT = 'design/tokens.json';

export class TokensError extends Error {
  override name = 'TokensError';
  constructor(
    message: string,
    public exitCode = 1,
  ) {
    super(message);
  }
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function findRepoRoot(start: string): Promise<string> {
  let dir = start;
  while (true) {
    if (await exists(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

async function ensureInstalled(cwd: string): Promise<void> {
  if (await exists(join(cwd, 'node_modules', PACKAGE))) return;
  throw new TokensError(`${PACKAGE} 가 설치돼 있지 않습니다.\n  설치: pnpm add -D ${PACKAGE}`);
}

function runDesignMd(args: string[], cwd: string): Promise<number> {
  return new Promise((res) => {
    const proc = spawn('npx', [PACKAGE, ...args], { stdio: 'inherit', cwd });
    proc.on('exit', (code) => res(code ?? 1));
    proc.on('error', () => res(1));
  });
}

function runDesignMdToFile(args: string[], cwd: string, outFile: string): Promise<number> {
  return new Promise((res) => {
    const chunks: Buffer[] = [];
    const proc = spawn('npx', [PACKAGE, ...args], {
      stdio: ['inherit', 'pipe', 'inherit'],
      cwd,
    });
    proc.stdout?.on('data', (chunk: Buffer) => chunks.push(chunk));
    proc.on('exit', async (code) => {
      if (code === 0) {
        try {
          await mkdir(dirname(outFile), { recursive: true });
          await writeFile(outFile, Buffer.concat(chunks));
        } catch {
          res(1);
          return;
        }
      }
      res(code ?? 1);
    });
    proc.on('error', () => res(1));
  });
}

export async function tokensCommand(options: TokensOptions = {}): Promise<void> {
  const cwd = await findRepoRoot(process.cwd());
  const inRel = options.in ?? DEFAULT_IN;
  const outRel = options.out ?? DEFAULT_OUT;
  const input = resolve(cwd, inRel);
  const output = resolve(cwd, outRel);

  await ensureInstalled(cwd);

  if (!(await exists(input))) {
    throw new TokensError(`입력 파일 없음: ${inRel}`);
  }

  if (options.lint) {
    const code = await runDesignMd(['lint', input], cwd);
    if (code !== 0) throw new TokensError(`${PACKAGE} lint 실패`, code);
  }

  const code = await runDesignMdToFile(['export', input, '--format', 'dtcg'], cwd, output);
  if (code !== 0) throw new TokensError(`${PACKAGE} export 실패`, code);

  console.log(chalk.green(`✓ ${outRel}`));
}
