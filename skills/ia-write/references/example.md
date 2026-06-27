# 작성 예시 (dogfood)

UXResearchEngine 에서 실제로 작성한 IA 한 벌에서 발췌. 화면 1 + 플로우 1.

## 화면 예시 — `screens/project-list.md`

```markdown
---
id: project-list
route: /
status: keep
components:
  - AppHeader
  - Card
  - Badge
  - Button
  - Input
---

# 프로젝트 목록

워크스페이스의 모든 프로젝트를 보고 진입하는 홈.
프로젝트 = 만들 결과물(컨텐츠, 랜딩페이지 등) 단위. 그 제작에 쓰는 리서치 데이터·챗을 담는다.

## 구성 (Input/Layout)

- AppHeader (컨텍스트/액션 없음 — 최상위 화면)
- 타이틀 영역: "워크스페이스" 라벨 + "프로젝트" 헤딩 + 총 개수
- 도구 행: `+ 새 프로젝트` 버튼 / 검색 인풋
- 프로젝트 카드 그리드 (2열, 모바일 1열): 이름 + badge + 설명 + 갱신 라벨

## Do (행동)

- 프로젝트 검색: 인풋으로 목록 필터
- 새 프로젝트 생성: 모달 또는 즉시 생성 (현재 버튼만, 동작 미구현)

## Go (이동)

- 프로젝트 카드 클릭 → [project-detail]
```

## 플로우 예시 — `screens/chat/flows/persona-tool.md` (발췌)

화면(chat) 안의 "페르소나 도구" 가 커서 별도 플로우로 분리한 경우. chat 에 flow 가 생겨
`screens/chat.md` → `screens/chat/chat.md` + `flows/` 로 폴더 승격됐다.

```markdown
---
id: persona-tool
kind: flow
in_screen: chat # 채팅 도구 탭에서 동작
scope: project # 페르소나는 프로젝트 단위 공유 (가정 — 변경 가능)
status: new
components:
  - ToolContextSidebar
  - PersonaPicker
  - Modal
  - Card
  - Button
  - Classroom # 시뮬레이션 (모달 내부, DS 재작성 대상)
---

# 페르소나 툴 플로우

채팅 도구 탭의 페르소나 기능 — 생성 / 선택 / 삭제 + 시뮬레이션 호출.

## B. 생성 — 무엇을 주입하나

사용자가 직접 두 축을 입력해 만든다.

### 인구학적 통계 (직접 입력)

- 이름 / 연령대 / 성별 / 사용 빈도 / 직업 / 지역 / 기술 숙련도

### 정체성 (직접 입력)

- 목표 / 동기 / 이탈 트리거

## 연결

- 화면: [chat]
```
