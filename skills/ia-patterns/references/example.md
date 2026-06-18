# 예시 (UXResearchEngine dogfood)

IA 4 파일(screens 3 + flows 1)에 절차를 그대로 돌린 실제 결과.

## 스캔 + 차감 + 접기 결과

`kind: flow` 인 `persona-tool`(`in_screen: chat`)을 chat 으로 접고, DS 원자를 표시:

| 컴포넌트           | 화면 수 | DS? | 거취                        |
| ------------------ | ------- | --- | --------------------------- |
| AppHeader          | 3       | —   | **공통 승격 → 레이아웃 셸** |
| Button / Card      | 3       | DS  | 원자 (재사용 확인)          |
| Badge              | 2       | DS  | 원자                        |
| Input              | 1       | DS  | 원자                        |
| Modal              | 1       | DS  | → DS `Dialog` 로 환산       |
| ToolContextSidebar | 1       | —   | 페이지 로컬 (chat)          |
| ChatComposer       | 1       | —   | 페이지 로컬 (chat)          |
| PersonaPicker      | 1       | —   | 페이지 로컬 (chat)          |
| Classroom          | 1       | —   | 페이지 로컬 (chat)          |
| DialogueBox        | 1       | —   | 페이지 로컬 (chat)          |
| VerdictCard        | 1       | —   | 페이지 로컬 (chat)          |

> 접기 전엔 ToolContextSidebar·Classroom 등이 2 회(persona-tool + chat)로 잡혔지만,
> persona-tool 이 곧 chat 이라 1 회로 교정 — **플로우 접기가 없으면 가짜 승격이 난다.**

## 승격 결과

비-DS 중 ≥2 는 **AppHeader 하나**뿐 → `AppShell` 레이아웃 셸로 승격.

```markdown
---
id: app-shell
kind: pattern
pattern_type: layout-shell
appears_in: # 스캔 산출
  - project-list
  - project-detail
  - chat
components:
  - AppHeader
code: components/ui/app-shell.tsx
---
```

빌드: `AppShell`(래퍼 + `header` 슬롯 + children) + `AppShellMain`(중앙 정렬 본문).
AppHeader 는 **슬롯으로 주입** — 화면별 `showContext` 등 props 를 그대로 유지.

## 성급한 추상화 방지가 작동한 지점

- 시뮬레이션 클러스터(Classroom·DialogueBox·VerdictCard)는 chat 한 곳뿐 → **공통으로 안 올림**.
  로컬이라고 raw 로 두는 게 아니라, 재작성 시 기존 DS 원자(Card·Badge·Button)로 조립한다.
- 처음 `tone: parchment | canvas` 변형을 넣었다가, 3 화면 모두 parchment 라 **canvas 제거** —
  IA 에 없는 변형은 만들지 않는다.
