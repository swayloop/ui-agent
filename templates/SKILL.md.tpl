---
name: ui-agent-workflow
description: TODO — consumer 채움. 어떤 작업 시 이 SKILL 이 로드될지 1~2 줄 (예 "UI 페이지/컴포넌트 작성 시")
---

# UI Agent Workflow

이 SKILL 은 [@swayloop/ui-agent](https://github.com/swayloop/ui-agent) 의 디자인 워크플로우를 따른다.
워크플로우 정의: [DESIGN-WORKFLOW.md](https://github.com/swayloop/ui-agent/blob/main/docs/DESIGN-WORKFLOW.md).

## DESIGN.md 참조

`design/DESIGN.md` 를 먼저 읽어 토큰·컴포넌트·원칙 숙지. 본문에 없는 값은 추가 X — `proposed_*` 로 보고만.

## 컴포넌트 생성 (Workflow Step 2)

- shadcn MCP 로 설치 + 커스텀 (`components/ui/*.tsx`)
- 각 컴포넌트마다 `.stories.tsx` 동반 (`components/stories/*`)
- `components/components.manifest.json` 에 등록 (이름·variant·slots·tags)

## 페이지 코드 변환 (Workflow Step 5)

- 워커 컨텍스트: `components/` + `stories/` + manifest + Figma 페이지
- 공통 파일 워커 1 개 → 페이지 워커 N 개 (파일 소유권 분리)
- 다른 워커가 소유한 파일·전역 CSS·토큰 절대 수정 X

## 가드레일

`.claude/hooks/` 의 hook 이 PreToolUse 로 강제 — exit 2 차단, exit 0 허용.
hook 실패 시 *작업 보고에 명시* 하고 사람 결정 대기.

<!-- consumer 가 추가 워크플로우 지시 사항을 여기에 -->
