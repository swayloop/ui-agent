# 워커 sub-agent 절차 (컴포넌트 1개 빌드)

메인 에이전트가 `Agent` tool 로 띄운 워커가 받는 절차. **검증은 안 함** — 검증은 메인이 모든 워커 끝난 뒤 한 번에 트리거.

입력: 컴포넌트 이름 (예: `button`), `DESIGN.md` 위치.
출력: `components/ui/<name>.tsx`, `components/stories/<name>.stories.tsx`, `components/ui/<name>.manifest.json`.

## 1. DESIGN.md 읽기

해당 컴포넌트 관련 토큰 / variant / 원칙 추출. 예 (Button):

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

→ 어떤 토큰 / variant / 상호작용을 쓸지 결정.

## 2. CLI 로 베이스 fetch

```bash
$ pnpm dlx shadcn add button
# → components/ui/button.tsx 생성
```

샌드박스에서 권한 / 네트워크 거부 시 2~3회 재시도 후 메인에게 보고. (MCP 는 메타데이터만 주고 소스 본문 안 줘서 fetch 는 항상 CLI 가 담당.)

## 3. 베이스 정화 + 토큰 매핑

shadcn 베이스에는 우리 DESIGN.md 와 무관한 표현이 섞여 옴:

- 표준 shadcn 스타일 (예: `shadow-sm`, `border` 기본값) — DESIGN.md 가 명시적으로 금지한 항목이면 제거
- 디자인 값을 하드코딩한 arbitrary (예: `grid-rows-[auto_auto]`, `h-[44px]`, `bg-[#hex]`) — 메인의 lint 가 에러로 잡지만 여기서 미리 정리
- 디자인 원칙 어긋난 표현 (예: 우리는 elevation 대신 border 로 구분한다면 모든 `shadow-*` 제거)

> **carve-out**: 프레임워크가 런타임에 채우는 CSS var 는 기능적 plumbing 이라 **유지**. 예: radix 의 `min-w-[var(--radix-select-trigger-width)]` 를 지우면 Select 드롭다운 너비가 깨진다. 이런 줄은 `// eslint-disable-next-line better-tailwindcss/no-restricted-classes` 로 lint 만 명시적으로 우회 (디자인 값 하드코딩 / 프레임워크 plumbing 을 코드에서 구분).

베이스를 정화한 다음 DESIGN.md 결정을 토큰 클래스로 매핑:

`components/ui/button.tsx`:

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
        // DESIGN.md → destructive (예: danger 토큰이 정의되어 있을 때)
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

→ DESIGN.md 의 결정 (어떤 토큰) ↔ 클래스 (`bg-primary`, `text-on-primary`) 1:1 매핑. **arbitrary value 없음**. DESIGN.md 에 없는 토큰 (예: `danger`) 이 필요하면 작성 멈추고 메인에게 보고 — 워커가 임의로 토큰 추가하지 않음.

## 4. Storybook story

`components/stories/button.stories.tsx`:

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

## 5. manifest 작성

`components/ui/button.manifest.json` (컴포넌트 옆에 분산 저장 — 병렬 작업 충돌 회피):

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

→ 한 컴포넌트당 한 파일. 워커는 여기까지. 검증은 메인이 모든 워커 끝난 뒤 1회 트리거.
