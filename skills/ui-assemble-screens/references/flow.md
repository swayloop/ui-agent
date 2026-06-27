# 조립 절차

IA 한 화면을 React 페이지(`src/pages/<Screen>.tsx`)로 조립한다.

## 입력

- `ia/screens/<screen>.md` (+ `flows/`) — 조립 대상 화면 IA (DoGo Map)
- `ia/patterns/` — 레이아웃 셸 (`app-shell` 등)
- `components/ui/*` — DS 원자 + 빌드된 공통 컴포넌트 (+ `*.manifest.json`)
- `DESIGN.md` / `src/index.css @theme` — 허용 토큰

## 순서

1. **IA 읽기** — `## 구성` / Do / Go 와 frontmatter `components:` 파악.
2. **조립** — IA `components:` 의 컴포넌트로 `## 구성` 을 배치하고 Do·Go 를 배선한다(데이터 목업). 셸은 페이지마다 감싸지 말고 라우터의 **레이아웃 라우트**(`App.tsx`)에서 한 번 적용 — 페이지는 본문만 렌더, 라우트 등록도 거기서.
3. **검증** — `bash scripts/ui-assemble-screens.sh <page-files>` (eslint raw-tag·토큰 + prettier + tsc). raw-tag 게이트는 `scripts/eslint-raw-tag-gate.mjs` 를 앱의 `eslint.config.js` 에서 import 해 연결한다. DS 의미 검증은 `LLM_VERIFY=1` 일 때 `scripts/verify-design-system-llm.mjs` 가 IA + manifest + page 를 보고 보조 판정한다.
4. **보여주기 → 피드백 기록** — 결과를 보이고, 받은 피드백과 조치를 `references/feedback-log.md` 에 매번 누적.

## 제약 (검증 게이트가 강제)

- **IA 에 없는 구조·요소 추가 금지** — 빠진 게 있으면 코드로 메우지 말고 IA 갭으로 보고 (IA 먼저 수정).
