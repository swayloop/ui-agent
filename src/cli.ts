#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('ui-agent')
  .description('AI-native UI generation pipeline that works across Claude Code, Codex, Cursor, and Gemini CLI')
  .version('0.0.0');

program
  .command('init')
  .description('Scaffold DESIGN.md, SKILL.md, and ui-agent.config.json')
  .option('-f, --force', 'overwrite existing files')
  .action(async (options: { force?: boolean }) => {
    try {
      await initCommand(options);
    } catch (err) {
      console.error(chalk.red('init failed:'), err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

const notYet = (name: string) => () => {
  console.error(chalk.yellow(`${name}: not yet implemented`));
  process.exit(2);
};

program
  .command('tokens')
  .description('Generate tokens.json from DESIGN.md')
  .option('--force', 'regenerate even if tokens.json exists')
  .action(notYet('tokens'));

program
  .command('components [names...]')
  .description('Generate components (parallel workers)')
  .option('--force', 'regenerate even if components exist')
  .action(notYet('components'));

program
  .command('pages [routes...]')
  .description('Generate pages (parallel workers in worktrees)')
  .option('--force', 'regenerate even if pages exist')
  .action(notYet('pages'));

program
  .command('qa')
  .description('Run design lint, a11y, responsive, and visual QA')
  .action(notYet('qa'));

program
  .command('status')
  .description('Show pipeline state')
  .action(notYet('status'));

await program.parseAsync();
