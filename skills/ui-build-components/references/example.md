# Button 컴포넌트 워크플로우 (한 라운드)

UXResearchEngine 의 `frontend/src/theme.css` (Tailwind v4 `@theme`) 기반.

## 0. 전제

`theme.css` 가 이미 step 1 (`pnpm ui-agent tokens --format css-tailwind`) 로 생성돼 있음:

```css
@theme {
  --color-primary: #0066cc;
  --color-on-primary: #ffffff;
  --color-ink: #1d1d1f;
  --color-canvas: #ffffff;
  ...
}
```

→ Tailwind v4 가 `@theme` 토큰을 자동 인식 → `bg-primary`, `text-on-primary` 같은 유틸 즉시 사용 가능.

### shadcn MCP 연결 확인 — 현재 에이전트 기준

본인 도구 목록에 `shadcn` 관련 (예: `mcp__shadcn__*`) 있는지 확인. 없으면 연결 가이드:

- **Claude Code**: `claude mcp add shadcn -- npx -y shadcn@canary mcp`
- **Codex**: `~/.codex/config.toml` 의 `[mcp_servers.shadcn]` 에 `command = "npx"`, `args = ["-y","shadcn@canary","mcp"]`
- 공식 docs: <https://ui.shadcn.com/docs/mcp>

연결 후 에이전트 재시작 필요할 수 있음.

### Storybook 설치 확인

```bash
$ ls .storybook/ 2>/dev/null || grep -q '"@storybook' package.json && echo OK || echo "Storybook 없음 — 설치 안내"
```

미설치 시:

```bash
pnpm dlx storybook@latest init
```

거부 / 보류면 아래 step 3 (story 작성) skip.

### eslint-plugin-tailwindcss 설치 확인

```bash
$ grep -q '"eslint-plugin-tailwindcss"' package.json && echo OK || echo "eslint-plugin-tailwindcss 없음 — 설치 안내"
```

미설치 시:

```bash
pnpm add -D eslint-plugin-tailwindcss
```

그리고 `eslint.config.js` 에 등록 (아래 "5. 검증" 섹션 참고). step 5 lint 강제의 전제 — 미설치면 하드코딩 차단 안 됨.

## 1. shadcn MCP 로 베이스 설치

```
shadcn MCP: install button → components/ui/button.tsx
```

## 2. 컴포넌트 본문 (theme 토큰 매핑)

`components/ui/button.tsx`:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary hover:bg-primary-focus',
        ghost: 'text-ink hover:bg-surface-pearl',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
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

→ `bg-primary` / `text-on-primary` 는 `theme.css` 의 `--color-primary` / `--color-on-primary` 로 매핑됨. **arbitrary value 없음**.

## 3. Storybook story

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

## 4. manifest 등록

`components/components.manifest.json` (예시 스키마):

```json
{
  "components": [
    {
      "name": "Button",
      "path": "components/ui/button.tsx",
      "variants": ["default", "ghost", "destructive"],
      "sizes": ["md", "sm"],
      "slots": [],
      "tags": ["interactive", "cta"]
    }
  ]
}
```

## 5. 검증 — `eslint-plugin-tailwindcss` 셋업

`eslint.config.js`:

```js
import tailwind from 'eslint-plugin-tailwindcss';

export default [
  ...tailwind.configs['flat/recommended'],
  {
    rules: {
      'tailwindcss/no-arbitrary-value': 'error',
    },
    settings: {
      tailwindcss: {
        callees: ['cn', 'cva', 'clsx'],
      },
    },
  },
];
```

→ `tailwindcss/no-arbitrary-value: error` 가 `text-[#ff0000]` / `p-[13px]` 같은 하드코딩을 error 로 차단. `callees` 로 `cn()`, `cva()` 안의 클래스도 검사.

## 6. 검증 실행 — pass

```bash
$ pnpm prettier --check components/ui/button.tsx
All matched files use Prettier code style!

$ pnpm eslint components/ui/button.tsx
# (출력 없음 = 통과)
```

→ pass. 다음 컴포넌트 또는 step 3 (`/ui-design-pages`).

## 7. 검증 실행 — fail 예시

만약 본문에 하드코딩 색을 썼다면:

```tsx
// 잘못된 예 — 하드코딩
default: 'bg-[#0066cc] text-white';
```

```bash
$ pnpm eslint components/ui/button.tsx
components/ui/button.tsx
  6:18  error  Arbitrary value 'bg-[#0066cc]' is not allowed
                tailwindcss/no-arbitrary-value
```

**수정**: `theme.css` 의 토큰 (`--color-primary`) 을 쓰는 Tailwind 유틸 (`bg-primary`) 로 교체. 토큰에 없는 색이면 `theme.css` (또는 그 source `DESIGN.md`) 부터 갱신 후 step 1 재실행.

→ fail 보고 형식 (사람에게):

```
✗ Button 컴포넌트 lint fail
  - components/ui/button.tsx:6 — bg-[#0066cc] 하드코딩 (tailwindcss/no-arbitrary-value)
  수정 후보: bg-primary
  결정 대기 — 진행할지, theme.css 갱신할지
```
