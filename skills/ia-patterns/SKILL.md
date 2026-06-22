---
name: ia-patterns
description: IA 의 frontmatter `components:` 를 전 화면 스캔해 공통화를 도출 — shadcn 프리미티브에 해당하는 공통 컴포넌트는 ui-build-components 핸드오프, 레이아웃 셸·반복 콘텐츠 패턴은 인벤토리·빌드. 절차·예시는 references/ 참고
allowed-tools: Bash, Read, Write
---

# ia-patterns

## 어떻게 (필요한 문서로 이동)

- 스캔(1~4단계 결정적) → `python3 scripts/scan-components.py --ia <IA_DIR> --ui <UI_DIR>`
- 도출 절차 전체 (스캔 → DS 차감 → 플로우 접기 → 빈도 승격 → 분류 → 빌드) → references/flow.md
- 실제 도출 예시 → references/example.md

## 다음

- 공통 컴포넌트 빌드 — `ui-build-components` 로 핸드오프 (스캔 표의 _공통 컴포넌트_ 거취가 입력).
- 셸/패턴 빌드 — 승격분을 코드 + manifest 게이트로 (인벤토리가 입력).
- IA + 빌드된 셸·패턴·컴포넌트로 화면 조립.
