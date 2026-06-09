# 전체 워크플로우 예시 (Button 한 라운드)

메인 사전 확인 → sub-agent 분배 → 워커 산출 → 메인 검증 까지 한 흐름.

## 0. 사전 확인 — 명령

```bash
# DESIGN.md 위치
$ find . -name DESIGN.md -not -path '*/node_modules/*'
./frontend/DESIGN.md

# shadcn CLI
$ pnpm dlx shadcn --version

# 검증 도구 dep
$ grep -E '"(@storybook/test-runner|@storybook/addon-a11y|axe-playwright|eslint-plugin-better-tailwindcss)"' package.json
```

미설치 시:

```bash
pnpm add -D eslint-plugin-better-tailwindcss \
            @storybook/test-runner @storybook/addon-a11y axe-playwright
npx playwright install chromium
```

> `eslint-plugin-tailwind-v4` 는 cva variants 안을 검사 못 함 → `better-tailwindcss` 로. test-runner 는 런타임 `cn()` (= `twMerge`) 이 같은 그룹 클래스 합쳐 떨구는 회귀 (대비 불량 등) 를 잡음.

## 1. 컴포넌트 목록 결정

DESIGN.md 발췌:

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

이번 라운드: `Button` (실제로는 N개 병렬 분배 — 여기선 Button 하나로 흐름 시연).

## 2. sub-agent 분배 — Agent 호출 형태

```
Agent(prompt="
  references/worker-flow.md 절차로 컴포넌트 1개 빌드.
  - 이름: button
  - DESIGN.md: ./frontend/DESIGN.md
  검증 안 함. 출력: components/ui/button.tsx + button.stories.tsx + button.manifest.json
")
```

워커가 결정 사항 (DESIGN.md 에 없는 토큰 / 권한 등) 만나면 메인으로 escalate.

## 3. 워커 산출 (Button)

### components/ui/button.tsx

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

→ DESIGN.md 결정 ↔ 클래스 1:1 매핑. **arbitrary value 없음**.

### components/stories/button.stories.tsx

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

### components/ui/button.manifest.json

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

## 4. 검증 셋업 코드 (메인 1회 트리거 전 인프라)

### eslint.config.js

```js
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

export default [
  {
    plugins: { 'better-tailwindcss': betterTailwindcss },
    settings: {
      'better-tailwindcss': { entryPoint: 'src/index.css' },
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': 'error',
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

→ `entryPoint` 의 `@import` 체인 따라 토큰 인식. cva / cn / clsx / twMerge / tv 인자 + nested object 까지.

### .storybook/main.ts

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/components/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
};
export default config;
```

### .storybook/test-runner.ts — 실제 axe 트리거

```ts
import { injectAxe, checkA11y } from 'axe-playwright';
import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, '#storybook-root', { detailedReport: true });
  },
};
export default config;
```

### package.json

```jsonc
{ "scripts": { "test-storybook": "test-storybook" } }
```

## 5. 검증 실행 — pass

모든 워커 끝난 후 메인이 1회 트리거:

```bash
$ pnpm prettier --check components/ui components/stories  # All matched files use Prettier code style!
$ pnpm eslint components/ui components/stories            # (출력 없음 = 통과)
$ pnpm test-storybook                                     # PASS Button > Default ... 3 passed
```

→ 다음 단계.

## 6. 검증 실행 — fail 보고 형식

### lint fail — cva variants 안 하드코딩

```
✗ Button lint fail
  - button.tsx:5 — bg-VARIANTBAD (no-unknown-classes)
  - button.tsx:6 — bg-[#0066cc] arbitrary (no-restricted-classes)
  DESIGN.md primary(#0066cc) 와 동일 → bg-primary 로 교체 권장
  VARIANTBAD 는 DESIGN.md 에 없음 → 갱신 여부 결정 필요
  결정 대기 — 진행할지, DESIGN.md 갱신할지
```

### a11y fail — 런타임 className 누락

eslint pass 인데 런타임에 `cn()` 이 `text-on-primary` 떨궈 흰 글자 누락:

```
✗ Button a11y fail
  - Default — color-contrast 2.43 (4.5 필요)
  - 추정 원인: text-on-primary 가 cn()/twMerge() 충돌로 누락 → ink 색 (#1d1d1f) 으로 렌더
  - 수정 후보: 컨슈머 lib/utils.ts 의 extendTailwindMerge 로 typography 토큰 분리
  결정 대기 — 컨슈머 측 cn() 정의 수정 여부
```

> 한계: axe 는 `::placeholder` 같은 가상요소 대비를 못 잡음. 대비 회귀의 보조 게이트일 뿐 a11y 전반 보증 아님 — 가상요소 / 동적 상태는 사람이 storybook 켜고 확인.
