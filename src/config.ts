import { z } from 'zod';

export const WorkerAgentSchema = z.enum(['claude', 'codex', 'cursor', 'gemini']);
export type WorkerAgent = z.infer<typeof WorkerAgentSchema>;

export const FrameworkSchema = z.enum(['next', 'remix', 'vite']);
export type Framework = z.infer<typeof FrameworkSchema>;

export const PathsSchema = z.object({
  designSpec: z.string().default('design/DESIGN.md'),
  skill: z.string().default('design/SKILL.md'),
  tokens: z.string().default('design/tokens.json'),
  componentsDir: z.string().default('components/ui'),
  storiesDir: z.string().default('components/stories'),
  manifest: z.string().default('components/components.manifest.json'),
  outputRoot: z.string().default('app'),
});

export const WorkerSchema = z.object({
  agent: WorkerAgentSchema.default('claude'),
  parallelism: z.number().int().min(1).max(16).default(4),
  isolation: z.enum(['worktree', 'sandbox']).default('worktree'),
});

export const FigmaSchema = z.object({
  fileKey: z.string().nullable().default(null),
  syncLibrary: z.boolean().default(false),
  generateMockups: z.boolean().default(false),
});

export const QaSchema = z.object({
  designLint: z.boolean().default(true),
  a11y: z.boolean().default(true),
  responsive: z.boolean().default(true),
  visualDiff: z.boolean().default(false),
  retryOnFail: z.number().int().min(0).max(5).default(1),
});

export const ConfigSchema = z
  .object({
    $schema: z.string().optional(),
    framework: FrameworkSchema.default('next'),
    designSystem: z.string().default('shadcn'),
    paths: PathsSchema.default({}),
    worker: WorkerSchema.default({}),
    figma: FigmaSchema.default({}),
    qa: QaSchema.default({}),
  })
  .passthrough();

export type Config = z.infer<typeof ConfigSchema>;
