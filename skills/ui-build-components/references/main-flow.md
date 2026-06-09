# 메인 에이전트 절차

`DESIGN.md` 의 컴포넌트 목록을 sub-agent 로 병렬 분배 + 검증 1회. 코드/스니펫 예시는 `main-example.md`, 워커 절차는 `worker-flow.md`.

## 0. 사전 확인

미충족 항목은 사람 결정 대기. 확인할 것:

- **`DESIGN.md` 위치 발견** — `find` 로 탐색. 못 찾으면 사람에게 경로 묻기
- **shadcn CLI + 네트워크 allowlist** — `pnpm dlx shadcn` 실행 권한 + 도메인 (`ui.shadcn.com`, `registry.npmjs.org`) 허용. 샌드박스 환경에선 명시 필요. 권한 거부는 간헐적 → 워커 fetch 시 2~3회 재시도
- **Storybook 설치** — 없으면 사람에게 설치 안내. 거부 / 보류 시 워커 story + 검증의 test-runner skip
- **검증 도구** — `eslint-plugin-better-tailwindcss`, `@storybook/test-runner` + `@storybook/addon-a11y` + `axe-playwright`, `.storybook/test-runner.ts` (preVisit/postVisit 훅). 미설치면 설치 + config 안내

## 1. 컴포넌트 목록 결정

DESIGN.md 의 `## Components` 절에서 이번 라운드에 만들 컴포넌트 N개를 사람과 확정.

## 2. sub-agent 분배 (병렬)

각 컴포넌트마다 `Agent` tool 로 워커 sub-agent 호출 — 동시 실행. 각 워커가 받는 지시 → `worker-flow.md`.

워커가 결정 사항 (DESIGN.md 에 없는 토큰 / 권한 / 토큰 추가 여부 등) 만나면 메인으로 escalate — 워커가 임의 결정 안 함.

## 3. 검증 1회

모든 워커 끝난 뒤 메인이 트리거:

- `pnpm prettier --check components/ui components/stories`
- `pnpm eslint components/ui components/stories` — `better-tailwindcss/no-unknown-classes` (DESIGN.md / `@theme` 토큰만 통과) + `no-restricted-classes` (arbitrary value 차단)
- `pnpm test-storybook` (Storybook 있을 때) — `.storybook/test-runner.ts` 의 axe 훅으로 a11y (대비 등) 검사

> 한계: axe 는 `::placeholder` 같은 가상요소 대비 못 잡음. 대비 회귀의 보조 게이트일 뿐 a11y 전반 보증 아님 — 가상요소 / 동적 상태는 사람이 storybook 켜고 확인.

## 4. 결과

- **pass** → 다음 단계
- **fail** → 사람 보고 + 진행 결정 대기 (자동 commit 금지). 보고 형식 → `main-example.md` 5 절
