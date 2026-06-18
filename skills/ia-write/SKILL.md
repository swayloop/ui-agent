---
name: ia-write
description: 화면 정보구조(IA)를 Markdown + YAML frontmatter (DoGo Map) 로 작성. code-first 디자인 파이프라인의 입력 산출물 (워크플로우 step 1). 포맷·예시는 references/ 참고
allowed-tools: Read, Write, Bash
---

# ia-write

화면 정보구조(IA)를 작성한다. 이 IA 가 code-first 디자인 파이프라인의 **입력 산출물** —
이후 단계의 에이전트가 이 파일들을 읽고 `DESIGN.md` 토큰 + `components/ui` 프리미티브로
패턴을 도출(step 2)하고 페이지를 조립(step 4)한다.

기능정의서를 따로 만들지 않는다. 기능 노트는 IA 항목에 **인라인**으로 적어 단일 산출물로 유지.

## 폴더 구조

```
ia/
├── README.md          # 작성 컨벤션 (이 스킬이 ship 하는 내용)
├── screens/           # 화면별 IA (1 화면 = 1 파일)
├── flows/             # 화면 내 기능/툴 상세 플로우 (screen 보다 작은 단위)
└── patterns/          # IA 스캔으로 도출된 공통 패턴 인벤토리 (step 2 산출물)
```

## 포맷

**Markdown 본문 + YAML frontmatter.** (`DESIGN.md` / `*.manifest.json` 컨벤션과 동일 결.)
**DoGo Map** 차용 — 구성 / Do(행동) / Go(이동) 세 블록.

전체 스펙·규칙은 `references/format.md`. 실제 작성 예시(화면 + 플로우)는 `references/example.md`.

## 핵심 규칙

- `components:` 는 **실제 코드명과 일치** — step 2 빈도 스캔과 step 4 조립이 이 값을 신뢰한다.
- `Go` 의 `[id]` 는 다른 화면 frontmatter `id` 를 가리킴 → 사이트맵 그래프 자동 형성.
- 기능 노트는 별도 문서 분리 금지, 해당 항목에 인라인.
- 확정 안 된 가정은 본문에 `(가정 — 변경 가능)` 으로 표시하고 진행 (성급한 확정 금지).

## 다음

- step 2: 공통 패턴 도출 (IA 스캔 → 패턴 인벤토리). `ia/patterns/` 채움.
