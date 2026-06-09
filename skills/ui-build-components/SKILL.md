---
name: ui-build-components
description: DESIGN.md 기반 shadcn 컴포넌트 N개를 sub-agent 로 분배·빌드 후 검증 1회. 워커 절차는 references/worker-flow.md 참고 (워크플로우 step 2)
allowed-tools: Bash, Read, Write, Agent
---

# ui-build-components

`DESIGN.md` (consumer repo 안 위치 가변) 의 컴포넌트 목록을 메인 에이전트가 **sub-agent N개로 병렬 분배**해 빌드하고, 모두 끝나면 **검증 1회**.

## 절차 (메인 에이전트)

0. **사전 확인** — 미충족 항목은 사람 결정 대기. 상세 → `references/example.md`:
   - `DESIGN.md` 위치 발견 (`find . -name DESIGN.md -not -path '*/node_modules/*'`)
   - shadcn CLI (`pnpm dlx shadcn`) 실행 권한 + 도메인 allowlist (`ui.shadcn.com`, `registry.npmjs.org`). 거부는 간헐적 → 워커 fetch 시 2~3회 재시도
   - Storybook 설치 (없으면 워커 story + 검증의 test-runner skip)
   - `eslint-plugin-better-tailwindcss` 설치
   - `@storybook/test-runner` + `@storybook/addon-a11y` + `axe-playwright` + `.storybook/test-runner.ts` (Storybook 있을 때만)
1. **컴포넌트 목록 결정** — DESIGN.md 의 `## Components` 절을 사람과 확정
2. **sub-agent 분배** — 컴포넌트마다 `Agent` tool 호출 (병렬). 워커 지시 → `references/worker-flow.md` (CLI fetch / 정화 / 토큰 매핑 / story / manifest 까지, 검증 안 함)
3. **검증 1회** — 모든 워커 끝난 뒤 메인이 트리거:
   - `pnpm prettier --check components/ui components/stories`
   - `pnpm eslint components/ui components/stories` (better-tailwindcss 의 `no-unknown-classes` + `no-restricted-classes`)
   - `pnpm test-storybook` — `.storybook/test-runner.ts` 의 axe 훅으로 a11y 검사
4. **fail** → 사람 보고 + 진행 결정 대기 (자동 commit 금지) / **pass** → 다음 단계

## 입력 / 출력

- 입력: 발견한 `DESIGN.md`, 만들 컴포넌트 목록
- 출력 (워커 산물): `components/ui/<name>.tsx`, `components/stories/<name>.stories.tsx`, `components/ui/<name>.manifest.json`

> Tailwind 가 인식하는 `@theme` CSS 는 consumer 의 인프라. AI 가 직접 만지지 않음.

## 다음

- step 3: `/ui-design-pages` (Figma 페이지 디자인)
