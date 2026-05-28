#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('ui-agent')
  .description(
    'shadcn-style ship of UI agent workflow assets (DESIGN.md / SKILL.md / 가드레일 hook)',
  )
  .version('0.0.0');

program
  .command('init')
  .description('Scaffold ship 자산 (DESIGN.md, SKILL.md, .claude/settings.json, hook)')
  .option('-f, --force', 'overwrite existing files')
  .action(async (options: { force?: boolean }) => {
    try {
      await initCommand(options);
    } catch (err) {
      console.error(chalk.red('init failed:'), err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

await program.parseAsync();
