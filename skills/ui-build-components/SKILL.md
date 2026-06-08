---
name: ui-build-components
description: shadcn 베이스 컴포넌트 + Storybook + manifest 작성 시 로드 (워크플로우 step 2)
allowed-tools: Bash, Read, Write
---

# ui-build-components

`design/DESIGN.md` 의 토큰 / variant / 원칙을 기준으로 shadcn 컴포넌트 + Storybook story + manifest 작성. 표현은 Tailwind 클래스로 (consumer 의 `.css` 의 `@theme` 가 자동 인식). 검증: **prettier + eslint (static) + storybook test-runner + addon-a11y (런타임 a11y)**. 상세는 step 6.

## 절차

0. **사전 확인** — 현재 에이전트 (Claude / Codex 중 본인) 기준. 미충족 항목 있으면 사람 결정 대기. 상세 → `references/example.md` "0. 전제":
   - **`design/DESIGN.md` 존재** — AI 가 이번 컴포넌트 작업의 판단 근거로 삼음
   - **shadcn MCP 연결** — 본인 도구 목록에 shadcn 관련 있는지. 없으면 연결 가이드 안내
   - **Storybook 설치** — `.storybook/` 또는 `package.json` 의 `@storybook/*`. 없으면 `pnpm dlx storybook@latest init` 안내. 거부 / 보류 시 step 4 (story) + step 6 의 test-runner skip
   - **`eslint-plugin-better-tailwindcss` 설치** — `package.json` dep + `eslint.config.js` 등록 확인. 없으면 설치 + config 안내 (`references/example.md` 6. 검증 참고)
   - **`@storybook/test-runner` + `@storybook/addon-a11y` + `axe-playwright` 설치** (Storybook 있을 때만) — `package.json` dep + `.storybook/test-runner.ts` (preVisit/postVisit 훅) + `npx playwright install chromium` 확인. 없으면 설치 + config 안내 (`references/example.md` 6. 검증 참고)
1. **DESIGN.md 읽기** — 이번 컴포넌트에 쓸 토큰 (color / typography / spacing / radius) + variant + 디자인 원칙 파악
2. shadcn MCP 로 베이스 설치 → `components/ui/<name>.tsx`
3. **베이스 정화 + 토큰 매핑** — shadcn 베이스에는 우리 DESIGN.md 와 무관한 표현이 섞여 옴 (예: `shadow-sm`, `grid-rows-[auto_auto]` 같은 arbitrary value, 기타 표준 shadcn 규칙). 본문 작성 전:
   - DESIGN.md 가 명시적으로 금지한 표현 (예: "카드에 그림자 금지") 전부 제거
   - **디자인 값을 하드코딩한** arbitrary (`bg-[#hex]`, `p-[Npx]` 등) 전부 제거 — step 6 lint 에 걸리지만 여기서 미리 정리
   - **carve-out**: 프레임워크 런타임 var (radix 등) 는 유지 — 상세 `references/example.md` step 3
   - 그 후 DESIGN.md 결정한 토큰을 Tailwind 클래스로 매핑 (예: primary → `bg-primary`)
4. Storybook story → `components/stories/<name>.stories.tsx`
5. `components/components.manifest.json` 에 등록 (name · variants · slots · tags)
6. 검증 (SKILL 절차 안 — 이번 라운드 컴포넌트만 대상, 전체 회귀는 `pnpm verify` 의 몫):
   - `pnpm prettier --check <대상>`
   - `pnpm eslint <대상>` — `better-tailwindcss/no-unknown-classes` (미정의 토큰 차단) + `no-restricted-classes` (arbitrary value 차단)
   - `pnpm test-storybook components/stories/<name>.stories.tsx` (Storybook 있을 때) — addon-a11y 의 axe 룰로 대비 등 a11y 위반 자동 fail
   - **fail** → 사람 보고 + 진행 결정 대기 (자동 commit 금지)
   - **pass** → 다음 컴포넌트 또는 step 3

## 입력 / 출력

- 입력: `design/DESIGN.md` (AI 의 판단 source), 제작할 컴포넌트
- 출력: `components/ui/<name>.tsx`, `components/stories/<name>.stories.tsx`, `components/components.manifest.json`

> 참고: Tailwind 가 인식하는 `@theme` CSS (theme.css / index.css / 어디든) 는 consumer 의 인프라. AI 가 직접 만지지 않음 — Tailwind 컴파일러 + lint plugin 이 자동으로 처리.

## 어떻게 (참고)

- **DESIGN.md → 컴포넌트 변환 한 라운드 (Button) + eslint-plugin-better-tailwindcss + test-runner/a11y 셋업** → `references/example.md`

## 다음

- step 3: `/ui-design-pages` (Figma 페이지 디자인)
