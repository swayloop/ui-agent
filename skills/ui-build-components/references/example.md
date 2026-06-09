# 메인 에이전트 워크플로우 (Button 한 라운드)

`DESIGN.md` 의 컴포넌트 목록 → sub-agent 분배 → 검증 1회. 워커 절차는 `worker-flow.md`.

## 0. 전제

### DESIGN.md — AI 의 판단 근거

먼저 위치 발견:

```bash
$ find . -name DESIGN.md -not -path '*/node_modules/*'
./frontend/DESIGN.md
```

→ 못 찾으면 사람에게 경로 묻기.

### shadcn CLI + 네트워크 allowlist 확인 (샌드박스 환경)

```bash
$ pnpm dlx shadcn --version 2>/dev/null && echo OK || echo "shadcn CLI 실행 권한 없음 — 사람에게 허용 요청"
```

샌드박스 / 백그라운드 에이전트 환경에선 다음 도메인 allowlist 명시 필요:

- `ui.shadcn.com` (컴포넌트 fetch)
- `registry.npmjs.org` (pnpm dlx 의 패키지 다운로드)

권한 거부는 간헐적이라 워커 fetch 시 2~3회 재시도 후 메인에게 보고 (첫 거부로 멈추면 false negative).

### Storybook 설치 확인

```bash
$ ls .storybook/ 2>/dev/null || grep -q '"@storybook' package.json && echo OK || echo "Storybook 없음 — 설치 안내"
```

미설치 시:

```bash
pnpm dlx storybook@latest init
```

거부 / 보류면 워커의 story 생성 + step 3 의 test-runner skip.

### eslint-plugin-better-tailwindcss 설치 확인

```bash
$ grep -q '"eslint-plugin-better-tailwindcss"' package.json && echo OK || echo "없음 — pnpm add -D eslint-plugin-better-tailwindcss + config (3. 검증 참고)"
```

`eslint-plugin-tailwind-v4` 는 cva 의 base 문자열만 검사하고 `variants` 객체 안은 무시 (소스: `rules/no-undefined-classes.js` 의 `extractClassNames` 가 `Literal`/`TemplateLiteral` 만 처리). 그래서 `better-tailwindcss` 로 교체.

### @storybook/test-runner + addon-a11y + axe-playwright 설치 확인 (Storybook 있을 때)

```bash
$ grep -q '"@storybook/test-runner"' package.json \
  && grep -q '"@storybook/addon-a11y"' package.json \
  && grep -q '"axe-playwright"' package.json \
  && echo OK || echo "없음 — pnpm add -D @storybook/test-runner @storybook/addon-a11y axe-playwright + .storybook/test-runner.ts + npx playwright install chromium (3. 검증 참고)"
```

런타임에 `cn()` (= `twMerge`) 이 같은 그룹 클래스 (예: `text-on-primary` 색 + `text-body` 크기) 를 합쳐 떨구는 경우 — CSS 는 정상 생성, className 만 빠져서 static 으로 못 잡음. test-runner 가 헤드리스 Chromium 렌더 + axe 로 잡음.

## 1. 컴포넌트 목록 결정

이번 라운드 (예시): `Button`, `Card`, `Input`. DESIGN.md 의 `## Components` 절에서 추출 후 사람과 확정.

## 2. sub-agent 분배 (병렬)

각 컴포넌트마다 워커 sub-agent 호출. **세 워커가 병렬로 동시 실행**:

```
Agent(name="ui-build-worker-button", prompt="
  references/worker-flow.md 의 절차에 따라 컴포넌트 1개 빌드.
  - 이름: button
  - DESIGN.md: ./frontend/DESIGN.md
  검증은 안 함. 출력만:
    components/ui/button.tsx
    components/stories/button.stories.tsx
    components/ui/button.manifest.json
")
Agent(name="ui-build-worker-card", prompt="...")
Agent(name="ui-build-worker-input", prompt="...")
```

→ 워커가 끝나면 보고. 권한 / 토큰 / 결정 사항이 필요하면 메인으로 escalate (워커가 임의 결정 안 함).

## 3. 검증 — `eslint-plugin-better-tailwindcss` 셋업

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

### test-runner + addon-a11y + axe-playwright 셋업

설치:

```bash
pnpm add -D @storybook/test-runner @storybook/addon-a11y axe-playwright
npx playwright install chromium
```

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

`.storybook/test-runner.ts` — **실제 axe 트리거**:

```ts
import { injectAxe, checkA11y } from 'axe-playwright';
import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  },
};
export default config;
```

`package.json` script:

```jsonc
{
  "scripts": {
    "test-storybook": "test-storybook",
  },
}
```

> **한계**: axe 는 `::placeholder` 같은 가상요소 대비를 못 본다 (예: Input placeholder 색 대비 회귀는 게이트 통과). 대비 회귀의 보조 게이트이지 a11y 전반 보증 아님 — 가상요소 / 동적 상태는 사람이 storybook 켜고 확인.

## 4. 검증 실행 — pass

모든 워커 완료 후 메인이 1회 트리거:

```bash
$ pnpm prettier --check components/ui components/stories
All matched files use Prettier code style!

$ pnpm eslint components/ui components/stories
# (출력 없음 = 통과)

$ pnpm test-storybook
PASS  Button > Default
PASS  Button > Ghost
PASS  Button > Destructive
PASS  Card > Default
PASS  Input > Default
Test Suites: 3 passed, 3 total
```

→ pass. 다음 단계 (`/ui-design-pages`).

## 5. 검증 실행 — fail 예시

### lint fail — cva variants 안 하드코딩

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

→ fail 보고 형식:

```
✗ Button 컴포넌트 lint fail
  - components/ui/button.tsx:5 — cva variants 안 bg-VARIANTBAD (no-unknown-classes)
  - components/ui/button.tsx:6 — cva variants 안 bg-[#0066cc] arbitrary (no-restricted-classes)
  DESIGN.md 확인: primary(#0066cc) 와 동일 → bg-primary 로 교체 권장
  VARIANTBAD 는 DESIGN.md 에 없음 → 갱신 여부 결정 필요
  결정 대기 — 진행할지, DESIGN.md 갱신할지
```

### a11y fail — 런타임 className 누락

eslint pass 인데도 런타임에 `cn()` 이 `text-on-primary` 를 떨궈 흰 글자가 사라진 경우:

```bash
$ pnpm test-storybook
FAIL  Button > Default
  Expected 0 a11y violations but received 1:
  - color-contrast: Element has insufficient color contrast of 2.43 (foreground: #1d1d1f, background: #0066cc, expected: 4.5)
    <button class="... bg-primary text-body">Click</button>
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
