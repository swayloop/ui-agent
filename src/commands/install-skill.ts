import { access, cp, lstat, mkdir, readdir, readlink, rm, symlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import chalk from 'chalk';

const PACKAGE_ROOT = resolve(import.meta.dirname, '..', '..');
const SKILLS_DIR = join(PACKAGE_ROOT, 'skills');

const AGENTS_SKILLS_REL = '.agents/skills';
const CLAUDE_SKILLS_REL = '.claude/skills';
const CLAUDE_LINK_TARGET = '../.agents/skills';

export interface InstallSkillOptions {
  target?: string;
  force?: boolean;
  all?: boolean;
  list?: boolean;
}

export class InstallSkillError extends Error {
  override name = 'InstallSkillError';
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

async function listAvailable(): Promise<string[]> {
  if (!(await exists(SKILLS_DIR))) return [];
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const skills: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (await exists(join(SKILLS_DIR, e.name, 'SKILL.md'))) {
      skills.push(e.name);
    }
  }
  return skills.sort();
}

type LinkState = 'ok' | 'missing' | 'wrong-target' | 'real-dir' | 'other';

async function checkClaudeLink(path: string): Promise<LinkState> {
  let stats;
  try {
    stats = await lstat(path);
  } catch {
    return 'missing';
  }
  if (!stats.isSymbolicLink()) return 'real-dir';
  try {
    const actual = await readlink(path);
    return actual === CLAUDE_LINK_TARGET ? 'ok' : 'wrong-target';
  } catch {
    return 'other';
  }
}

async function ensureClaudeLink(target: string): Promise<void> {
  const linkPath = join(target, CLAUDE_SKILLS_REL);
  const state = await checkClaudeLink(linkPath);

  if (state === 'ok') {
    console.log(
      `  ${chalk.dim('skip  ')} ${CLAUDE_SKILLS_REL} ${chalk.dim('(symlink already correct)')}`,
    );
    return;
  }
  if (state === 'real-dir' || state === 'wrong-target' || state === 'other') {
    throw new InstallSkillError(
      `${CLAUDE_SKILLS_REL} 이 예상과 다름 (${state}). 수동 정리 후 재실행:\n` +
        `  - 실 디렉토리면 내용물 .agents/skills/ 로 이동 후 .claude/skills 삭제\n` +
        `  - 다른 심링크면 삭제\n` +
        `  - 그 후 다시 install-skill 실행 (이 명령이 올바른 심링크 생성)`,
    );
  }
  // missing
  await mkdir(dirname(linkPath), { recursive: true });
  await symlink(CLAUDE_LINK_TARGET, linkPath);
  console.log(
    `  ${chalk.green('link  ')} ${CLAUDE_SKILLS_REL} ${chalk.dim('→ ' + CLAUDE_LINK_TARGET)}`,
  );
}

async function installOne(name: string, target: string, force: boolean): Promise<void> {
  const src = join(SKILLS_DIR, name);
  if (!(await exists(join(src, 'SKILL.md')))) {
    const avail = (await listAvailable()).join(', ') || '(없음)';
    throw new InstallSkillError(`SKILL 없음: ${name}\n  사용 가능: ${avail}`);
  }

  const dst = join(target, AGENTS_SKILLS_REL, name);
  if (await exists(dst)) {
    if (!force) {
      console.log(
        `  ${chalk.yellow('skip  ')} ${AGENTS_SKILLS_REL}/${name} ${chalk.dim('(--force 로 덮어쓰기)')}`,
      );
      return;
    }
    await rm(dst, { recursive: true, force: true });
    await mkdir(dirname(dst), { recursive: true });
    await cp(src, dst, { recursive: true });
    console.log(
      `  ${chalk.green('create')} ${AGENTS_SKILLS_REL}/${name} ${chalk.dim('(overwritten)')}`,
    );
    return;
  }
  await mkdir(dirname(dst), { recursive: true });
  await cp(src, dst, { recursive: true });
  console.log(`  ${chalk.green('create')} ${AGENTS_SKILLS_REL}/${name}`);
}

export async function installSkillCommand(
  name: string | undefined,
  options: InstallSkillOptions = {},
): Promise<void> {
  if (options.list) {
    const skills = await listAvailable();
    if (skills.length === 0) {
      console.log(chalk.dim('(설치 가능한 SKILL 없음)'));
    } else {
      for (const s of skills) console.log(`  ${s}`);
    }
    return;
  }

  if (!options.all && !name) {
    throw new InstallSkillError('SKILL 이름이 필요합니다 (또는 --all)');
  }

  const target = options.target ? resolve(options.target) : await findRepoRoot(process.cwd());

  if (!(await exists(target))) {
    throw new InstallSkillError(`--target 디렉토리 없음: ${target}`);
  }

  const names = options.all ? await listAvailable() : [name as string];
  if (names.length === 0) {
    throw new InstallSkillError('설치할 SKILL 이 없습니다');
  }

  console.log();
  console.log(chalk.bold(`Installing SKILLs into ${chalk.cyan(target)}`));
  console.log();

  for (const n of names) {
    await installOne(n, target, options.force ?? false);
  }
  await ensureClaudeLink(target);

  console.log();
  console.log(
    chalk.dim('  Codex 는 .agents/skills/ 를 native scan — 별도 .codex/skills/ 매핑 불필요'),
  );
  console.log();
}
