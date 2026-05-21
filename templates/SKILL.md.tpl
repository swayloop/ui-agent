# SKILL.md

이 프로젝트의 코딩·디자인 컨벤션. agent가 모든 명령에서 따라야 한다.
DESIGN.md가 *무엇을* 만들지라면, 이 파일은 *어떻게* 만들지다.

## Naming

- 컴포넌트: PascalCase (예: `KPICard`)
- 파일: kebab-case (예: `kpi-card.tsx`)
- 페이지 라우트: `/snake-case` 또는 `/kebab-case` (Next 컨벤션 따름)

## Tokens

- 색상·간격·radius는 design tokens만 사용. 하드코딩 금지.
- 토큰이 없으면 결과 JSON에 `proposed_tokens`로 보고. 직접 추가 금지.

## Components

- 공용 컴포넌트(`components/ui/*`)는 `components.manifest.json`에 등록된 것만 사용.
- 새로 필요하면 `proposed_components`로 보고. 직접 만들지 않는다.
- 페이지 전용 컴포넌트는 `app/<route>/components/`에만 둔다.

## Style

- TypeScript strict.
- Tailwind 클래스는 토큰 기반 유틸만 사용 (`bg-background`, `text-foreground` 등).
- 인라인 스타일·매직 넘버 금지.

## A11y

- 모든 인터랙티브 요소는 키보드 포커스 가능.
- `alt` / `aria-label` 누락 금지.
- 색상 대비 WCAG AA 이상.
