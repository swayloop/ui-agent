---
name: ui-build-components
description: shadcn 베이스 컴포넌트 + Storybook + manifest 작성 시 로드 (워크플로우 step 2)
allowed-tools: Bash, Read, Write
---

# ui-build-components

**Tailwind v4 `@theme` CSS** (예: `frontend/src/theme.css`) 기반으로 shadcn 컴포넌트 + Storybook story + manifest 를 한 컴포넌트씩 만들고, **prettier + eslint** (`eslint-plugin-tailwindcss/no-arbitrary-value`) 로 토큰 준수 검증.

전제: step 1 (`pnpm ui-agent tokens --format css-tailwind`) 결과인 `theme.css` 가 이미 존재.

## 절차

0. **사전 확인** — 현재 에이전트 (Claude / Codex 중 본인) 기준. 미충족 항목 있으면 사람 결정 대기. 상세 → `references/example.md` "0. 전제":
   - **shadcn MCP 연결** — 본인 도구 목록에 shadcn 관련 있는지. 없으면 연결 가이드 안내
   - **Storybook 설치** — `.storybook/` 또는 `package.json` 의 `@storybook/*`. 없으면 `pnpm dlx storybook@latest init` 안내. 거부 / 보류 시 step 3 (story) skip
   - **eslint-plugin-tailwindcss 설치** — `package.json` 의 dep 및 `eslint.config.js` 에 등록 여부. 없으면 `pnpm add -D eslint-plugin-tailwindcss` + config 스니펫 안내 (step 5 lint 강제용)
1. shadcn MCP 로 베이스 설치 → `components/ui/<name>.tsx`
2. theme 토큰을 Tailwind 클래스로 매핑해 컴포넌트 본문 작성 (예: `bg-primary`, `text-on-primary`)
3. Storybook story → `components/stories/<name>.stories.tsx`
4. `components/components.manifest.json` 에 등록 (name · variants · slots · tags)
5. 검증 (SKILL 절차 안):
   - `pnpm prettier --check <대상>`
   - `pnpm eslint <대상>` — `eslint-plugin-tailwindcss/no-arbitrary-value` 가 `text-[#ff0000]` / `p-[13px]` 같은 arbitrary value 를 error 로 차단
   - **fail** → 사람 보고 + 진행 결정 대기 (자동 commit 금지)
   - **pass** → 다음 컴포넌트 또는 step 3

## 입력 / 출력

- 입력: `theme.css` (Tailwind v4 `@theme`), 제작할 컴포넌트
- 출력: `components/ui/<name>.tsx`, `components/stories/<name>.stories.tsx`, `components/components.manifest.json`

## 어떻게 (참고)

- **Button 컴포넌트 한 라운드 + eslint-plugin-tailwindcss 셋업** → `references/example.md`

## 다음

- step 3: `/ui-design-pages` (Figma 페이지 디자인)
