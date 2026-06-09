---
name: ui-build-components
description: DESIGN.md 기반 shadcn 컴포넌트 N개를 sub-agent 로 분배·빌드 후 검증 1회. 워커 절차는 references/worker-flow.md 참고 (워크플로우 step 2)
allowed-tools: Bash, Read, Write, Agent
---

# ui-build-components

`DESIGN.md` 기반 shadcn 컴포넌트 N개를 메인 에이전트가 **sub-agent 로 병렬 분배**해 빌드하고, 모두 끝나면 메인이 **검증 1회**.

## 어떻게 (참고)

- **메인 에이전트 절차** (사전 확인 / 컴포넌트 목록 / sub-agent 분배 / 검증 셋업 / pass·fail) → `references/example.md`
- **워커 sub-agent 절차** (1 컴포넌트 — CLI fetch / 정화 / 토큰 매핑 / story / manifest) → `references/worker-flow.md`
- **워커 산출 예시** (Button 의 .tsx / .stories.tsx / .manifest.json) → `references/worker-example.md`

## 다음

- step 3: `/ui-design-pages` (Figma 페이지 디자인)
