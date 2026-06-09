---
name: ui-build-components
description: DESIGN.md 기반 shadcn 컴포넌트 N개를 sub-agent 로 분배·빌드 후 검증 1회. 워커 절차는 references/worker-flow.md 참고 (워크플로우 step 2)
allowed-tools: Bash, Read, Write, Agent
---

# ui-build-components

메인 에이전트는 `DESIGN.md` (consumer repo 안 위치 가변 — 예: `design/`, `frontend/`, 루트) 의 컴포넌트 목록을 받아 **sub-agent N개로 병렬 분배**해 빌드하고, 모두 완료된 후 **검증 1회** (prettier / eslint / test-runner+a11y) 트리거. 워커 sub-agent 의 빌드 절차는 `references/worker-flow.md`. 검증 셋업과 fail 보고 예시는 `references/example.md`.

## 절차 (메인 에이전트)

0. **사전 확인** — 현재 에이전트 (Claude / Codex 중 본인) 기준. 미충족 항목 있으면 사람 결정 대기. 상세 → `references/example.md` "0. 전제":
   - **`DESIGN.md` 위치 발견** — `find . -name DESIGN.md -not -path '*/node_modules/*'` 로 탐색. 못 찾으면 사람에게 경로 묻기
   - **shadcn CLI + 네트워크 allowlist** — `pnpm dlx shadcn` 실행 권한 + 도메인 (`ui.shadcn.com`, `registry.npmjs.org` 등) 허용 확인. 샌드박스 환경에선 명시 필요. 권한 거부는 간헐적이라 워커 fetch 시 2~3회 재시도 후 사람 보고
   - **Storybook 설치** — `.storybook/` 또는 `package.json` 의 `@storybook/*`. 없으면 `pnpm dlx storybook@latest init` 안내. 거부 / 보류 시 워커의 story 생성 + step 3 의 test-runner skip
   - **`eslint-plugin-better-tailwindcss` 설치** — `package.json` dep + `eslint.config.js` 등록 확인. 없으면 설치 + config 안내 (`references/example.md` 3. 검증 참고)
   - **`@storybook/test-runner` + `@storybook/addon-a11y` + `axe-playwright` 설치** (Storybook 있을 때만) — `package.json` dep + `.storybook/test-runner.ts` (preVisit/postVisit 훅) + `npx playwright install chromium` 확인. 없으면 설치 + config 안내 (`references/example.md` 3. 검증 참고)
1. **컴포넌트 목록 결정** — DESIGN.md 의 `## Components` 절을 사람과 확정 (이번 라운드에 만들 N개)
2. **sub-agent 분배** — 각 컴포넌트마다 `Agent` tool 로 워커 sub-agent 호출. **병렬**. 각 워커가 받는 지시 → `references/worker-flow.md` (워커는 컴포넌트 1개를 CLI fetch → 정화 → 토큰 매핑 → story → manifest 까지 끝냄, 검증은 안 함)
3. **검증 1회** — 모든 워커 끝난 뒤 메인이 트리거:
   - `pnpm prettier --check components/ui components/stories`
   - `pnpm eslint components/ui components/stories` — `better-tailwindcss/no-unknown-classes` + `no-restricted-classes`
   - `pnpm test-storybook` (Storybook 있을 때) — `.storybook/test-runner.ts` 의 axe 훅으로 a11y (대비 등) 검사
4. **fail** → 사람 보고 + 진행 결정 대기 (자동 commit 금지) / **pass** → 다음 단계

## 입력 / 출력

- 입력: 발견한 `DESIGN.md` (메인의 판단 source), 만들 컴포넌트 후보 / 목록
- 출력 (워커가 만듦): `components/ui/<name>.tsx`, `components/stories/<name>.stories.tsx`, `components/ui/<name>.manifest.json`

> 참고: Tailwind 가 인식하는 `@theme` CSS (theme.css / index.css / 어디든) 는 consumer 의 인프라. AI 가 직접 만지지 않음 — Tailwind 컴파일러 + lint plugin 이 자동으로 처리.

## 다음

- step 3: `/ui-design-pages` (Figma 페이지 디자인)
