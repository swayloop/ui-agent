---
name: ui-build-components
description: shadcn 베이스 컴포넌트 + Storybook + manifest 작성 시 로드 (워크플로우 step 2)
allowed-tools: Bash, Read, Write
---

# ui-build-components

`DESIGN.md` (consumer repo 안 위치 가변 — 예: `design/`, `frontend/`, 루트) 의 토큰 / variant / 원칙을 기준으로 shadcn 컴포넌트 + Storybook story + manifest 작성. 표현은 Tailwind 클래스로 (consumer 의 `.css` 의 `@theme` 가 자동 인식). **이 SKILL 은 빌드 (step 1~5) 까지만 책임**. 검증 (prettier / eslint / test-runner / a11y) 은 중앙 도구 (verify) 가 한 번에 트리거 — storybook 서버 + Chromium 비용 때문에 컴포넌트마다 도는 건 비효율.

## 절차

0. **사전 확인** — 현재 에이전트 (Claude / Codex 중 본인) 기준. 미충족 항목 있으면 사람 결정 대기. 상세 → `references/example.md` "0. 전제":
   - **`DESIGN.md` 위치 발견** — `find . -name DESIGN.md -not -path '*/node_modules/*'` 로 탐색 (consumer 마다 위치 다름: `design/`, `frontend/`, 루트 등). 못 찾으면 사람에게 경로 묻기. AI 가 이번 컴포넌트 작업의 판단 근거로 삼음
   - **shadcn CLI + 네트워크 allowlist** — `pnpm dlx shadcn` 실행 권한 + 네트워크 도메인 (`ui.shadcn.com`, `registry.npmjs.org` 등) 허용 확인. 샌드박스 환경에선 명시 필요. 권한 거부는 간헐적이라 step 2 fetch 시 2~3회 재시도 후 사람 보고
   - **Storybook 설치** — `.storybook/` 또는 `package.json` 의 `@storybook/*`. 없으면 `pnpm dlx storybook@latest init` 안내. 거부 / 보류 시 step 4 (story) skip
1. **DESIGN.md 읽기** — 이번 컴포넌트에 쓸 토큰 (color / typography / spacing / radius) + variant + 디자인 원칙 파악
2. `pnpm dlx shadcn add <name>` 로 베이스 fetch → `components/ui/<name>.tsx`. 권한/네트워크 거부 시 2~3회 재시도
3. **베이스 정화 + 토큰 매핑** — shadcn 베이스의 디자인 규칙 위반 제거 후 토큰 매핑. 상세 → `references/example.md` step 3:
   - DESIGN.md 가 금지한 표현 + 디자인 값 하드코딩 arbitrary (`bg-[#hex]` 등) 제거
   - **carve-out**: 프레임워크 런타임 var (radix 등) 는 유지
   - DESIGN.md 결정한 토큰을 Tailwind 클래스로 매핑 (예: primary → `bg-primary`)
4. Storybook story → `components/stories/<name>.stories.tsx`
5. `components/ui/<name>.manifest.json` 작성 (name · variants · slots · tags) — 컴포넌트 옆에 분산 저장 (병렬 작업 충돌 회피). 집계는 별도 도구의 몫
6. **검증은 이 SKILL 의 책임 아님** — 중앙 도구 (verify) 가 prettier / eslint (better-tailwindcss) / test-runner + axe-playwright 를 한 번에 트리거. 셋업 코드는 verify SKILL (#39) 참고. 이 SKILL 은 step 5 (manifest 작성) 까지로 종료

## 입력 / 출력

- 입력: `DESIGN.md` (consumer repo 안 발견된 경로 — AI 의 판단 source), 제작할 컴포넌트
- 출력: `components/ui/<name>.tsx`, `components/stories/<name>.stories.tsx`, `components/ui/<name>.manifest.json`

> 참고: Tailwind 가 인식하는 `@theme` CSS (theme.css / index.css / 어디든) 는 consumer 의 인프라. AI 가 직접 만지지 않음 — Tailwind 컴파일러 + lint plugin 이 자동으로 처리.

## 다음

- step 3: `/ui-design-pages` (Figma 페이지 디자인)
