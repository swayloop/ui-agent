# 예시 (UXResearchEngine dogfood — RAG 평가 워크벤치)

IA 5 파일(screens 4 + flow 1)에 절차를 돌린 결과. 스크립트가 1~4단계, 사람이 5단계를 맡는다.

## 스캔 결과 (스크립트 출력)

`promote-version`(flow, `in_screen: experiment-detail`)을 접고 DS 원자를 차감:

| 컴포넌트                   | 화면 수 | 거취(빈도만)  |
| -------------------------- | ------- | ------------- |
| AppHeader                  | 4       | **공통 승격** |
| MetricBar                  | 3       | **공통 승격** |
| Table / Chart / TraceList  | 1       | 페이지 로컬   |
| Badge·Button·Card·Dialog·… | —       | 원자 (차감)   |

> 접기 전엔 MetricBar 가 4회로 잡히지만 flow 가 곧 experiment-detail 이라 3회로 교정 —
> 접기가 없으면 가짜 승격이 난다. `ia/legacy/` 는 스캔에서 자연 제외.

## 5단계 분류

스크립트는 **빈도만** 본다. 사람이 **shadcn 프리미티브인지**로 가른다:

- **공통 컴포넌트 → `ui-build-components` 핸드오프** — `Table`·`Chart`, 그리고 점수 막대
  `MetricBar`(= shadcn `Progress`). 전부 shadcn 이 프리미티브로 제공 → 1 화면이든 3 화면이든
  핸드오프. (빈도는 무관.)
- **레이아웃 셸** — `AppHeader`(4 화면) → `AppShell`(래퍼 + `header` 슬롯). 슬롯 주입으로
  화면별 props 유지. `ia/patterns/app-shell.md` 인벤토리 기록.
- **페이지 로컬** — `TraceList`: run-detail 한 곳뿐인 도메인 조합(질문별 trace 펼침). shadcn
  프리미티브가 아니므로 핸드오프 대상도 아니다 → 그 화면에서 DS 원자로 조립.

> 핵심: `Table`·`Chart`·`TraceList` 가 스크립트 표엔 똑같이 1 화면 "페이지 로컬"이지만,
> shadcn 프리미티브(`Table`·`Chart`)는 핸드오프, 아닌 것(`TraceList`)만 페이지 로컬로 남는다.
> 판정선은 등장 횟수가 아니라 **shadcn 제공 여부**다.
