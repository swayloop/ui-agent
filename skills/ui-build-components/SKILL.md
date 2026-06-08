---
name: ui-build-components
description: shadcn 베이스 컴포넌트 + Storybook + manifest 작성 시 로드 (워크플로우 step 2)
allowed-tools: Bash, Read, Write
---

# ui-build-components

`design/DESIGN.md` 의 토큰 / variant / 원칙을 기준으로 shadcn 컴포넌트 + Storybook story + manifest 작성. 표현은 Tailwind 클래스로 (consumer 의 `.css` 의 `@theme` 가 자동 인식). 검증은 **prettier + eslint** (`eslint-plugin-tailwind-v4` 의 `no-undefined-classes`) 로 arbitrary value 차단.

## 절차

0. **사전 확인** — 현재 에이전트 (Claude / Codex 중 본인) 기준. 미충족 항목 있으면 사람 결정 대기. 상세 → `references/example.md` "0. 전제":
   - **`design/DESIGN.md` 존재** — AI 가 이번 컴포넌트 작업의 판단 근거로 삼음
   - **shadcn MCP 연결** — 본인 도구 목록에 shadcn 관련 있는지. 없으면 연결 가이드 안내
   - **Storybook 설치** — `.storybook/` 또는 `package.json` 의 `@storybook/*`. 없으면 `pnpm dlx storybook@latest init` 안내. 거부 / 보류 시 step 4 (story) skip
   - **`eslint-plugin-tailwind-v4` 설치** — `package.json` 의 dep 및 `eslint.config.js` 에 등록 여부. 없으면 `pnpm add -D eslint-plugin-tailwind-v4` + config 스니펫 안내 (step 6 lint 강제용)
1. **DESIGN.md 읽기** — 이번 컴포넌트에 쓸 토큰 (color / typography / spacing / radius) + variant + 디자인 원칙 파악
2. shadcn MCP 로 베이스 설치 → `components/ui/<name>.tsx`
3. DESIGN.md 에서 결정한 토큰을 Tailwind 클래스로 매핑해 컴포넌트 본문 작성 (예: DESIGN.md 의 primary 색 → `bg-primary`)
4. Storybook story → `components/stories/<name>.stories.tsx`
5. `components/components.manifest.json` 에 등록 (name · variants · slots · tags)
6. 검증 (SKILL 절차 안):
   - `pnpm prettier --check <대상>`
   - `pnpm eslint <대상>` — `tailwind-v4/no-undefined-classes` 가 `text-[#ff0000]` / `p-[13px]` 같은 arbitrary value 를 error 로 차단 (`allowArbitraryValues: false`)
   - **fail** → 사람 보고 + 진행 결정 대기 (자동 commit 금지)
   - **pass** → 다음 컴포넌트 또는 step 3

## 입력 / 출력

- 입력: `design/DESIGN.md` (AI 의 판단 source), 제작할 컴포넌트
- 출력: `components/ui/<name>.tsx`, `components/stories/<name>.stories.tsx`, `components/components.manifest.json`

> 참고: Tailwind 가 인식하는 `@theme` CSS (theme.css / index.css / 어디든) 는 consumer 의 인프라. AI 가 직접 만지지 않음 — Tailwind 컴파일러 + lint plugin 이 자동으로 처리.

## 어떻게 (참고)

- **DESIGN.md → 컴포넌트 변환 한 라운드 (Button) + eslint-plugin-tailwind-v4 셋업** → `references/example.md`

## 다음

- step 3: `/ui-design-pages` (Figma 페이지 디자인)
