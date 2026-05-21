---
version: 1
framework: next
design_system: shadcn
---

## Principles

<!-- 디자인 원칙. agent가 모든 명령에서 이 섹션을 본다. -->

- 모바일 우선
- 다크모드 기본
- 정보 밀도 > 화려함

## Components

<!-- 사용할 컴포넌트 목록. variant를 명시. -->
<!-- `ui-agent components`가 이 섹션을 보고 생성. -->

- Button (variant: default | destructive | ghost)
- Card
- DataTable

## Pages

<!-- 각 페이지는 `### /route` 헤더로 시작. `ui-agent pages`가 이 섹션을 파싱. -->

### /example

- 예시 페이지. 첫 페이지 만들 때 이 블록을 복사해서 시작.
- 좌측 사이드바, 상단 헤더, 메인 영역
- 필수 컴포넌트: Button, Card
