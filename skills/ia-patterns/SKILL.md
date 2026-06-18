---
name: ia-patterns
description: IA 의 frontmatter components: 를 전 화면 스캔해 공통 패턴(레이아웃 셸/반복 콘텐츠)을 빈도로 도출하고 인벤토리 + 셸 컴포넌트로 빌드. code-first 파이프라인 step 2. 절차·예시는 references/ 참고
allowed-tools: Bash, Read, Write
---

# ia-patterns

`ia/screens` · `ia/flows` 의 frontmatter `components:` 를 전 화면 스캔해 **공통 패턴을 빈도로
도출**한다. 입력은 step 1(`ia-write`) 산출물, 출력은 패턴 인벤토리(`ia/patterns/`) +
승격된 셸/패턴의 DS 컴포넌트·스토리. 핵심은 **성급한 추상화 방지** —
1 곳뿐인 요소는 올리지 않고, 이미 DS 원자인 것은 차감한다.

## 어떻게 (필요한 문서로 이동)

- 스캔(1~4단계 결정적) → `python3 scripts/scan-components.py --ia <IA_DIR> --ui <UI_DIR>`
- 도출 절차 전체 (스캔 → DS 차감 → 플로우 접기 → 빈도 승격 → 분류 → 빌드) → references/flow.md
- 실제 도출 예시 (UXResearchEngine dogfood) → references/example.md

## 다음

- step 3: 셸/패턴 빌드 — 승격분을 코드 + manifest 게이트로 (인벤토리가 입력).
