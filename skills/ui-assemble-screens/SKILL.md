---
name: ui-assemble-screens
description: IA(ia/screens) + 레이아웃 셸 + components/ui(DS·빌드된 컴포넌트) + DESIGN.md 토큰으로 React 페이지(src/pages)를 조립할 때 사용한다.
allowed-tools: Bash, Read, Write
---

# ui-assemble-screens

IA 한 화면을 셸·DS·빌드된 컴포넌트로 조립해 페이지로 만든다.

## 어떻게 (필요한 문서로 이동)

- 조립 절차 → references/flow.md
- 실제 조립 예시 → references/example.md
- 검증 → `bash scripts/ui-assemble-screens.sh` (검증 항목·환경변수는 `--help`)
- **피드백↔조치 기록** (조립 후 사용자 피드백을 매번 누적) → references/feedback-log.md

## 다음

- 피드백 루프: 조립 → 보여주기 → 피드백을 feedback-log 에 기록 → 해당 레이어 수정 → 재조립.
  라우팅 플로우(어느 피드백을 어느 레이어로)는 로그가 쌓인 뒤 설계 — **지금은 기록만** 한다.
