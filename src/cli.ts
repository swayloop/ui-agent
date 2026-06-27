#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { InstallSkillError, installSkillCommand } from './commands/install-skill.js';
import { TokensError, tokensCommand } from './commands/tokens.js';

const program = new Command();

program.name('ui-agent').description('AI-native UI generation pipeline helpers').version('0.0.0');

program
  .command('tokens')
  .description('DESIGN.md → tokens (DTCG / Tailwind / ...) 변환 (@google/design.md 래핑)')
  .option('--in <path>', `입력 DESIGN.md 경로 (기본 design/DESIGN.md)`)
  .option('--out <path>', `출력 파일 경로 (기본 design/tokens.json)`)
  .option(
    '--format <fmt>',
    `출력 format. @google/design.md 에 그대로 전달 (dtcg / css-tailwind / json-tailwind / tailwind / ...). 기본 dtcg`,
  )
  .option('--lint', '변환 전에 @google/design.md lint 실행 (WCAG / 참조 검증)')
  .action(async (options: { in?: string; out?: string; format?: string; lint?: boolean }) => {
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

program
  .command('install-skill [name]')
  .description(
    'SKILL 을 consumer 의 .agents/skills/ 에 설치 + .claude/skills 디렉토리 심링크 (cross-agent)',
  )
  .option('--target <dir>', '설치 대상 (기본 현재 repo root)')
  .option('--force', '기존 항목 덮어쓰기')
  .option('--all', '전체 SKILL 설치')
  .option('--list', '설치 가능한 SKILL 목록만 출력')
  .action(
    async (
      name: string | undefined,
      options: { target?: string; force?: boolean; all?: boolean; list?: boolean },
    ) => {
      try {
        await installSkillCommand(name, options);
      } catch (err) {
        if (err instanceof InstallSkillError) {
          console.error(chalk.red('✗'), err.message);
          process.exit(err.exitCode);
        }
        console.error(chalk.red('install-skill failed:'), err instanceof Error ? err.message : err);
        process.exit(1);
      }
    },
  );

await program.parseAsync();
