# 워커 출력 예시 (Button)

`worker-flow.md` 절차로 빌드된 컴포넌트 1개 — 산출 파일 3개의 실제 형태.

## DESIGN.md 발췌 (입력 — 워커가 읽음)

```markdown
## Colors

- primary: #0066cc # 기본 CTA. interactive 한 액션
- on-primary: #ffffff # primary 위 텍스트
- ink: #1d1d1f # 본문 텍스트
- surface-pearl: #fafafc # ghost / 보조 hover 배경

## Components

- Button (variant: default | ghost | destructive; size: md | sm)
  - default: primary 면 + on-primary 텍스트
  - ghost: 투명, ink 텍스트, surface-pearl hover
  - destructive: 빨강 계열
```

## components/ui/button.tsx (산출 1)

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50',
  {
    variants: {
      variant: {
        // DESIGN.md → primary + on-primary
        default: 'bg-primary text-on-primary hover:bg-primary-focus',
        // DESIGN.md → 투명 + ink 텍스트 + surface-pearl hover
        ghost: 'text-ink hover:bg-surface-pearl',
        // DESIGN.md → destructive (danger 토큰 정의되어 있을 때)
        destructive: 'bg-danger text-on-danger hover:bg-danger-focus',
      },
      size: {
        md: 'h-10 px-4 text-sm',
        sm: 'h-8 px-3 text-xs',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

→ DESIGN.md 의 결정 ↔ 클래스 1:1 매핑. **arbitrary value 없음**.

## components/stories/button.stories.tsx (산출 2)

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../ui/button';

const meta: Meta<typeof Button> = { component: Button };
export default meta;

export const Default: StoryObj<typeof Button> = { args: { children: 'Click' } };
export const Ghost: StoryObj<typeof Button> = { args: { variant: 'ghost', children: 'Ghost' } };
export const Destructive: StoryObj<typeof Button> = {
  args: { variant: 'destructive', children: 'Delete' },
};
```

## components/ui/button.manifest.json (산출 3)

```json
{
  "name": "Button",
  "path": "components/ui/button.tsx",
  "variants": ["default", "ghost", "destructive"],
  "sizes": ["md", "sm"],
  "slots": [],
  "tags": ["interactive", "cta"]
}
```
