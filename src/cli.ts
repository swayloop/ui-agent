#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { TokensError, tokensCommand } from './commands/tokens.js';

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

program
  .command('tokens')
  .description('DESIGN.md → tokens.json (DTCG) 변환 (@google/design.md 래핑)')
  .option('--in <path>', `입력 DESIGN.md 경로 (기본 design/DESIGN.md)`)
  .option('--out <path>', `출력 tokens.json 경로 (기본 design/tokens.json)`)
  .option('--lint', '변환 전에 @google/design.md lint 실행 (WCAG / 참조 검증)')
  .action(async (options: { in?: string; out?: string; lint?: boolean }) => {
    try {
      await tokensCommand(options);
    } catch (err) {
      if (err instanceof TokensError) {
        console.error(chalk.red('✗'), err.message);
        process.exit(err.exitCode);
      }
      console.error(chalk.red('tokens failed:'), err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

await program.parseAsync();
