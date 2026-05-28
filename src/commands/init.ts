import { access, chmod, cp, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import chalk from 'chalk';

const PACKAGE_ROOT = resolve(import.meta.dirname, '..', '..');
const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');

export interface InitOptions {
  force?: boolean;
}

interface FileMapping {
  src: string;
  dst: string;
}

const MAPPINGS: FileMapping[] = [
  { src: 'DESIGN.md.tpl', dst: 'design/DESIGN.md' },
  { src: 'SKILL.md.tpl', dst: '.claude/skills/ui-agent-workflow/SKILL.md' },
  { src: 'SKILL.md.tpl', dst: '.codex/skills/ui-agent-workflow/SKILL.md' },
  { src: 'claude-settings.json.tpl', dst: '.claude/settings.json' },
  { src: 'design-lint-gate.sh.tpl', dst: '.claude/hooks/design-lint-gate.sh' },
  { src: 'design-lint-gate.sh.tpl', dst: '.codex/hooks/design-lint-gate.sh' },
];

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
    if (parent === dir) return start; // 루트 도달, .git 없음 — cwd fallback
    dir = parent;
  }
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = await findRepoRoot(process.cwd());
  console.log();
  console.log(chalk.bold(`Initializing @swayloop/ui-agent in ${chalk.cyan(cwd)}`));
  if (cwd !== process.cwd()) {
    console.log(chalk.dim(`  (auto-resolved repo root from ${process.cwd()})`));
  }
  console.log();

  let created = 0;
  let skipped = 0;

  for (const { src, dst } of MAPPINGS) {
    const from = join(TEMPLATES_DIR, src);
    const to = join(cwd, dst);

    if (!options.force && (await exists(to))) {
      console.log(`  ${chalk.yellow('skip')}   ${dst} ${chalk.dim('(already exists)')}`);
      skipped++;
      continue;
    }

    await mkdir(dirname(to), { recursive: true });
    await cp(from, to);
    if (to.endsWith('.sh')) {
      await chmod(to, 0o755);
    }
    console.log(`  ${chalk.green('create')} ${dst}`);
    created++;
  }

  console.log();
  console.log(chalk.dim(`  ${created} created, ${skipped} skipped`));
  console.log();
  console.log('Next steps:');
  console.log(`  1. ${chalk.cyan('design/DESIGN.md')} 채움 (또는 Awesome-Design-MD 등 외부 자산 채택)`);
  console.log(`  2. ${chalk.cyan('.claude/skills/ui-agent-workflow/SKILL.md')} 의 description + 본문 채움`);
  console.log(`     (Codex 도 동일 내용 — ${chalk.dim('.codex/skills/...')} 에 자동 카피됨, 편집 시 양쪽 동기화 필요)`);
  console.log(`  3. (Codex 사용 시) ${chalk.dim('.codex/hooks.json')} 직접 작성 — Claude settings.json 과 스키마 다름`);
  console.log();
}
