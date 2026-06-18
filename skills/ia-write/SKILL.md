---
name: ia-write
description: 화면 정보구조(IA)를 Markdown + YAML frontmatter (DoGo Map) 로 작성. code-first 디자인 파이프라인의 입력 산출물 (워크플로우 step 1). 포맷·예시는 references/ 참고
allowed-tools: Read, Write, Bash
---

# ia-write

화면 정보구조(IA)를 작성한다. 이 IA 가 code-first 디자인 파이프라인의 **입력 산출물** —
이후 단계가 이 파일들을 읽고 `DESIGN.md` 토큰 + `components/ui` 프리미티브로
패턴을 도출하고 페이지를 조립한다. 기능정의서를 따로 만들지 않고
**DoGo Map 단일 산출물**로 화면을 기술한다.

## 어떻게 (참고)

| 무엇                                | 참고                    |
| ----------------------------------- | ----------------------- |
| 폴더 구조 + frontmatter 스펙 + 규칙 | `references/format.md`  |
| 실제 작성 예시 (화면 + 플로우)      | `references/example.md` |

## 다음

- 공통 패턴 도출 (IA 스캔 → 패턴 인벤토리). `ia/patterns/` 채움.
