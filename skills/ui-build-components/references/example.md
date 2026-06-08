# Button 컴포넌트 워크플로우 (한 라운드)

`design/DESIGN.md` 의 디자인 결정을 Tailwind 클래스로 변환하는 한 라운드.

## 0. 전제

### DESIGN.md — AI 의 판단 근거

`design/DESIGN.md` 에서 이번 컴포넌트 관련 토큰 / variant / 원칙 추출. 예 (UXResearchEngine):

```markdown
## Colors

- primary: #0066cc # 기본 CTA. interactive 한 액션
- on-primary: #ffffff # primary 위 텍스트
- ink: #1d1d1f # 본문 텍스트
- surface-pearl: #fafafc # ghost / 보조 hover 배경
- ...

## Components

- Button (variant: default | ghost | destructive; size: md | sm)
  - default: primary 면 + on-primary 텍스트
  - ghost: 투명, ink 텍스트, surface-pearl hover
  - destructive: 빨강 계열
```

→ AI 가 이 결정 (어떤 토큰 / 어떤 variant / 어떤 상호작용) 을 보고 작업.

### 인프라 — AI 가 직접 만지지 않음

Tailwind 가 인식하는 `@theme` CSS 가 consumer 의 인프라에 있어야 함 (theme.css / index.css / 어디든). step 1 (`pnpm ui-agent tokens --format css-tailwind`) 결과를 쓰거나 consumer 가 직접 관리. AI 는 Tailwind 가 `bg-primary` 같은 클래스를 인식한다는 것만 전제로 함.

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

거부 / 보류면 아래 step 4 (story 작성) skip.

### eslint-plugin-better-tailwindcss 설치 확인

```bash
$ grep -q '"eslint-plugin-better-tailwindcss"' package.json && echo OK || echo "없음 — pnpm add -D eslint-plugin-better-tailwindcss + config (6. 검증 참고)"
```

`eslint-plugin-tailwind-v4` 는 cva 의 base 문자열만 검사하고 `variants` 객체 안은 무시 (소스: `rules/no-undefined-classes.js` 의 `extractClassNames` 가 `Literal`/`TemplateLiteral` 만 처리). 그래서 `better-tailwindcss` 로 교체.

### @storybook/test-runner + @storybook/addon-a11y 설치 확인 (Storybook 있을 때)

```bash
$ grep -q '"@storybook/test-runner"' package.json && grep -q '"@storybook/addon-a11y"' package.json && echo OK || echo "없음 — pnpm add -D @storybook/test-runner @storybook/addon-a11y + playwright install (6. 검증 참고)"
```

static 검증 통과해도 런타임에 `cn()` (= `twMerge`) 이 같은 그룹 클래스를 합쳐 떨구는 경우가 있다 (예: `text-on-primary` 색 + `text-body` 크기 → 색 누락). CSS 는 정상 생성, className 만 빠지는 거라 lint/typecheck/build 로 못 잡음 — test-runner 가 stories 를 실제 Chromium 으로 렌더해 axe-core 로 잡음.

## 1. DESIGN.md 에서 결정 추출

이번 라운드 (Button): primary / on-primary / ink / surface-pearl + 3 variants × 2 sizes.

## 2. shadcn MCP 로 베이스 설치

```
shadcn MCP: install button → components/ui/button.tsx
```

## 3. 컴포넌트 본문 — DESIGN.md 결정을 Tailwind 클래스로

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

→ DESIGN.md 의 결정 (어떤 토큰) ↔ 클래스 (`bg-primary`, `text-on-primary`) 1:1 매핑. **arbitrary value 없음**. DESIGN.md 에 없는 토큰 (예: `danger`) 이 필요하면 작성 멈추고 사람 보고 (fail 처리는 8 섹션).

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

## 5. manifest 등록

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

## 6. 검증 — `eslint-plugin-better-tailwindcss` 셋업

`eslint.config.js`:

```js
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

export default [
  {
    plugins: { 'better-tailwindcss': betterTailwindcss },
    settings: {
      'better-tailwindcss': {
        // consumer 의 CSS entry. @import 체인 따라 @theme 토큰 인식
        entryPoint: 'src/index.css',
      },
    },
    rules: {
      // DESIGN.md / @theme 에 없는 토큰 차단 (cva variants 안 nested 클래스 포함)
      'better-tailwindcss/no-unknown-classes': 'error',
      // arbitrary value (text-[#ff0000] / p-[13px]) 차단
      'better-tailwindcss/no-restricted-classes': [
        'error',
        {
          restrict: [
            {
              pattern: '\\[([^\\[\\]]*?)\\](?!:)',
              message: 'arbitrary value 금지 — DESIGN.md 토큰을 쓰거나 사람 결정 대기',
            },
          ],
        },
      ],
    },
  },
];
```

→ `entryPoint` 에서 `@import` 체인 따라 토큰 인식. cva / cn / clsx / twMerge / tv 인자 + nested object 까지 검사.

### test-runner + addon-a11y 셋업

`.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/components/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
};
export default config;
```

`.storybook/preview.ts`:

```ts
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    a11y: {
      // axe 위반을 test-runner 에서 error 로 (default 는 warning)
      test: 'error',
    },
  },
};
export default preview;
```

`package.json` script:

```jsonc
{
  "scripts": {
    "test-storybook": "test-storybook",
  },
}
```

> 한계: axe 가 잡는 건 a11y 룰 (대비 / ARIA / focusable) 뿐. 시각만 어색한 회귀 (padding 누락, variant 가 default 와 동일하게 보임) 는 못 잡음 → 사람이 storybook 켜고 확인.

## 7. 검증 실행 — pass

```bash
$ pnpm prettier --check components/ui/button.tsx
All matched files use Prettier code style!

$ pnpm eslint components/ui/button.tsx
# (출력 없음 = 통과)

$ pnpm test-storybook components/stories/button.stories.tsx
PASS  Default
PASS  Ghost
PASS  Destructive
Test Suites: 1 passed, 1 total
```

→ pass. 다음 컴포넌트 또는 step 3 (`/ui-design-pages`).

## 8. 검증 실행 — fail 예시

만약 cva variants 안에 하드코딩 색을 썼다면:

```tsx
// 잘못된 예 — cva variants 안 하드코딩
const buttonVariants = cva('inline-flex items-center', {
  variants: {
    variant: {
      default: 'bg-VARIANTBAD',
      destructive: 'bg-[#0066cc]',
    },
  },
});
```

```bash
$ pnpm eslint components/ui/button.tsx
components/ui/button.tsx
   5:18  error  'bg-VARIANTBAD' is not a known tailwind class
                 better-tailwindcss/no-unknown-classes
   6:22  error  arbitrary value 금지 — DESIGN.md 토큰을 쓰거나 사람 결정 대기
                 better-tailwindcss/no-restricted-classes
```

**수정 판단:**

1. 먼저 DESIGN.md 의 결정 확인 — 해당 색이 DESIGN.md 에 있는 token 이면 그 token 의 클래스 (예: `bg-primary`) 로 교체
2. DESIGN.md 에 없으면 **컴포넌트 작성 멈추고 사람 보고** — DESIGN.md 갱신 여부는 디자인 의사결정. SKILL 이 임의로 추가 안 함

→ fail 보고 형식 (사람에게):

```
✗ Button 컴포넌트 lint fail
  - components/ui/button.tsx:5 — cva variants 안 bg-VARIANTBAD (no-unknown-classes)
  - components/ui/button.tsx:6 — cva variants 안 bg-[#0066cc] arbitrary (no-restricted-classes)
  DESIGN.md 확인: primary(#0066cc) 와 동일 → bg-primary 로 교체 권장
  VARIANTBAD 는 DESIGN.md 에 없음 → 갱신 여부 결정 필요
  결정 대기 — 진행할지, DESIGN.md 갱신할지
```

### a11y fail 예시 — 런타임 className 누락

eslint pass 인데도 런타임에 `cn()` 이 `text-on-primary` 를 떨궈 흰 글자가 사라진 경우:

```bash
$ pnpm test-storybook components/stories/button.stories.tsx
FAIL  Default
  Expected 0 a11y violations but received 1:
  - color-contrast: Element has insufficient color contrast of 2.43 (foreground: #1d1d1f, background: #0066cc, expected: 4.5)
    <button class="... bg-primary text-body">Click</button>

Test Suites: 1 failed, 1 total
```

→ fail 보고 형식:

```
✗ Button 컴포넌트 a11y fail
  - Default story — color-contrast 2.43 (4.5 필요)
  - 추정 원인: text-on-primary 가 런타임에 누락 → ink 색 (#1d1d1f) 으로 렌더
  - 점검: cn() / twMerge() 가 같은 그룹 (text-*) 클래스를 합쳐 떨궜는지 확인
  - 수정 후보: 컨슈머 `lib/utils.ts` 의 `extendTailwindMerge` 로 typography 토큰 분리
  결정 대기 — 컨슈머 측 cn() 정의 수정 여부
```
