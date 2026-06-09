---
name: ui-build-components
description: shadcn 베이스 컴포넌트 + Storybook + manifest 작성 시 로드 (워크플로우 step 2)
allowed-tools: Bash, Read, Write
---

# ui-build-components

`DESIGN.md` (consumer repo 안 위치 가변 — 예: `design/`, `frontend/`, 루트) 의 토큰 / variant / 원칙을 기준으로 shadcn 컴포넌트 + Storybook story + manifest 작성. 표현은 Tailwind 클래스로 (consumer 의 `.css` 의 `@theme` 가 자동 인식). 검증: **prettier + eslint (static) + storybook test-runner + addon-a11y (런타임 a11y)**. 상세는 step 6.

## 절차

0. **사전 확인** — 현재 에이전트 (Claude / Codex 중 본인) 기준. 미충족 항목 있으면 사람 결정 대기. 상세 → `references/example.md` "0. 전제":
   - **`DESIGN.md` 위치 발견** — `find . -name DESIGN.md -not -path '*/node_modules/*'` 로 탐색 (consumer 마다 위치 다름: `design/`, `frontend/`, 루트 등). 못 찾으면 사람에게 경로 묻기. AI 가 이번 컴포넌트 작업의 판단 근거로 삼음
   - **shadcn MCP 연결** — 본인 도구 목록에 shadcn 관련 있는지. 없으면 연결 가이드 안내
   - **Storybook 설치** — `.storybook/` 또는 `package.json` 의 `@storybook/*`. 없으면 `pnpm dlx storybook@latest init` 안내. 거부 / 보류 시 step 4 (story) + step 6 의 test-runner skip
   - **`eslint-plugin-better-tailwindcss` 설치** — `package.json` dep + `eslint.config.js` 등록 확인. 없으면 설치 + config 안내 (`references/example.md` 6. 검증 참고)
   - **`@storybook/test-runner` + `@storybook/addon-a11y` + `axe-playwright` 설치** (Storybook 있을 때만) — `package.json` dep + `.storybook/test-runner.ts` (preVisit/postVisit 훅) + `npx playwright install chromium` 확인. 없으면 설치 + config 안내 (`references/example.md` 6. 검증 참고)
1. **DESIGN.md 읽기** — 이번 컴포넌트에 쓸 토큰 (color / typography / spacing / radius) + variant + 디자인 원칙 파악
2. shadcn MCP 로 베이스 설치 → `components/ui/<name>.tsx`
3. **베이스 정화 + 토큰 매핑** — shadcn 베이스의 디자인 규칙 위반 제거 후 토큰 매핑. 상세 → `references/example.md` step 3:
   - DESIGN.md 가 금지한 표현 + 디자인 값 하드코딩 arbitrary (`bg-[#hex]` 등) 제거
   - **carve-out**: 프레임워크 런타임 var (radix 등) 는 유지
   - DESIGN.md 결정한 토큰을 Tailwind 클래스로 매핑 (예: primary → `bg-primary`)
4. Storybook story → `components/stories/<name>.stories.tsx`
5. `components/ui/<name>.manifest.json` 작성 (name · variants · slots · tags) — 컴포넌트 옆에 분산 저장 (병렬 작업 충돌 회피). 집계는 별도 도구의 몫
6. 검증 (SKILL 절차 안 — 이번 라운드 컴포넌트만 대상, 전체 회귀는 `pnpm verify` 의 몫):
   - `pnpm prettier --check <대상>`
   - `pnpm eslint <대상>` — `better-tailwindcss/no-unknown-classes` (미정의 토큰 차단) + `no-restricted-classes` (arbitrary value 차단)
   - `pnpm test-storybook components/stories/<name>.stories.tsx` (Storybook 있을 때) — addon-a11y 의 axe 룰로 대비 등 a11y 위반 자동 fail
   - **fail** → 사람 보고 + 진행 결정 대기 (자동 commit 금지)
   - **pass** → 다음 컴포넌트 또는 step 3

## 입력 / 출력

- 입력: `DESIGN.md` (consumer repo 안 발견된 경로 — AI 의 판단 source), 제작할 컴포넌트
- 출력: `components/ui/<name>.tsx`, `components/stories/<name>.stories.tsx`, `components/ui/<name>.manifest.json`

> 참고: Tailwind 가 인식하는 `@theme` CSS (theme.css / index.css / 어디든) 는 consumer 의 인프라. AI 가 직접 만지지 않음 — Tailwind 컴파일러 + lint plugin 이 자동으로 처리.

## 다음

- step 3: `/ui-design-pages` (Figma 페이지 디자인)
