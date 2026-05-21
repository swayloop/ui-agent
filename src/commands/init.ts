import { access, cp, mkdir } from 'node:fs/promises';
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
  { src: 'SKILL.md.tpl', dst: 'design/SKILL.md' },
  { src: 'ui-agent.config.json.tpl', dst: 'ui-agent.config.json' },
];

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = process.cwd();
  console.log();
  console.log(chalk.bold(`Initializing @swayloop/ui-agent in ${chalk.cyan(cwd)}`));
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
    console.log(`  ${chalk.green('create')} ${dst}`);
    created++;
  }

  console.log();
  console.log(chalk.dim(`  ${created} created, ${skipped} skipped`));
  console.log();
  console.log('Next steps:');
  console.log(`  1. Edit ${chalk.cyan('design/DESIGN.md')} with your components and pages`);
  console.log(`  2. Run ${chalk.cyan('pnpm ui-agent tokens')} to generate design tokens`);
  console.log(`  3. Run ${chalk.cyan('pnpm ui-agent components')} to generate components`);
  console.log(`  4. Run ${chalk.cyan('pnpm ui-agent pages')} to generate pages`);
  console.log();
}
