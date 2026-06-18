# IA 포맷 스펙

화면 파일과 플로우 파일 두 종류. 둘 다 Markdown 본문 + YAML frontmatter

## 폴더 구조

```
ia/
├── README.md          # 작성 컨벤션 (consumer 레포에 둠)
├── screens/           # 화면별 IA (1 화면 = 1 파일)
├── flows/             # 화면 내 기능/툴 상세 플로우 (screen 보다 작은 단위)
└── patterns/          # IA 스캔으로 도출된 공통 패턴 인벤토리 (step 2 산출물)
```

## 화면 파일 (`screens/<id>.md`)

```markdown
---
id: <kebab-id> # 화면 식별자 (Go 링크가 가리키는 대상)
route: <react-router 경로>
status: keep | drop | new # 기능 축소/재정의 후 거취
components: # 이 화면이 쓰는 DS/공통 컴포넌트 (빈도 스캔 대상)
  - ComponentName
---

# <화면 이름>

<화면 한두 줄 목적 설명>

## 구성 (Input/Layout)

- 화면을 이루는 영역·요소 (위→아래 / 좌→우 순)

## Do (행동)

- <동사-명사>: 결과/이동 # 사용자가 할 수 있는 행동

## Go (이동)

- <트리거> → [target-screen-id] # 다른 화면으로의 이동
```

## 플로우 파일 (`flows/<id>.md`)

화면 하나 안의 기능/툴이 커서 화면 IA 만으로 부족할 때만 분리. 화면보다 작은 단위.

```markdown
---
id: <kebab-id>
kind: flow
in_screen: <screen-id> # 어느 화면에서 동작하는가
scope: project | chat | ... # 데이터/상태 공유 범위 (가정이면 명시)
status: new | keep | drop
components:
  - ComponentName
---

# <플로우 이름>

<한두 줄 설명>

## A. <단계/모드>

- ...

## 연결

- 관련 플로우/이슈 링크
- 화면: [screen-id]
```

## 규칙

- **DoGo Map**: 구성(무엇으로 이루어지나) / Do(무엇을 하나) / Go(어디로 가나) 세 블록으로 화면을 기술.
- `components` 는 실제 코드명과 정확히 일치. 아직 없는(재작성 대상) 컴포넌트도 코드명으로 적되 주석으로 표시.
- `Go` 의 `[id]` 는 다른 화면 frontmatter `id` → 사이트맵 그래프가 자동 형성됨.
- 기능 노트(제약·동작 상세)는 별도 기능정의서로 빼지 말고 해당 Do/구성 항목에 인라인 인용(`>`)으로.
- 미확정 결정은 `(가정 — 변경 가능)` / `(미구현)` 등으로 솔직히 표시. 임의 확정 금지.
- 한 화면 = 한 파일. 1 곳뿐인 요소를 미리 공통 패턴으로 추상화하지 않는다 (그건 step 2 빈도 스캔의 일).
