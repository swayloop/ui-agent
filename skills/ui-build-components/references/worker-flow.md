# 워커 sub-agent 절차 (컴포넌트 1개 빌드)

메인 에이전트가 `Agent` tool 로 띄운 워커가 받는 절차. **검증은 안 함** — 검증은 메인이 모든 워커 끝난 뒤 한 번에 트리거. 코드/스키마 예시는 `worker-example.md`.

- **입력**: 컴포넌트 이름 (예: `button`), `DESIGN.md` 위치
- **출력**: `components/ui/<name>.tsx`, `components/stories/<name>.stories.tsx`, `components/ui/<name>.manifest.json`

## 1. DESIGN.md 읽기

해당 컴포넌트 관련 토큰 (color / typography / spacing / radius) + variant + 상호작용 / 디자인 원칙 추출.

## 2. CLI 로 베이스 fetch

```bash
pnpm dlx shadcn add <name>
```

샌드박스에서 권한 / 네트워크 거부 시 2~3회 재시도 후 메인에게 보고. (MCP 는 메타데이터만 주고 소스 본문 안 줘서 fetch 는 항상 CLI.)

## 3. 베이스 정화 + 토큰 매핑

shadcn 베이스에는 우리 DESIGN.md 와 무관한 표현이 섞여 옴. 본문 작성 전 제거:

- 표준 shadcn 스타일 (예: `shadow-sm`) — DESIGN.md 가 명시적으로 금지한 항목이면 제거
- 디자인 값을 하드코딩한 arbitrary (예: `h-[44px]`, `bg-[#hex]`) — 메인의 lint 가 에러로 잡지만 여기서 미리 정리
- 디자인 원칙 어긋난 표현 (예: elevation 대신 border 로 구분한다면 모든 `shadow-*`)

> **carve-out**: 프레임워크가 런타임에 채우는 CSS var 는 기능적 plumbing 이라 **유지**. 예: radix 의 `min-w-[var(--radix-select-trigger-width)]` 를 지우면 Select 드롭다운 너비가 깨진다. 이런 줄은 `// eslint-disable-next-line better-tailwindcss/no-restricted-classes` 로 lint 만 명시적으로 우회.

정화 후 DESIGN.md 결정을 토큰 클래스로 매핑 (예: primary → `bg-primary`). DESIGN.md 에 없는 토큰 (예: `danger`) 이 필요하면 작성 멈추고 메인에게 보고 — 워커가 임의로 토큰 추가하지 않음.

## 4. Storybook story

`components/stories/<name>.stories.tsx` 에 variant 별 story export.

## 5. manifest 작성

`components/ui/<name>.manifest.json` (컴포넌트 옆에 분산 저장 — 병렬 작업 충돌 회피). 필드: `name`, `replaces`, `path`, `variants`, `sizes`, `slots`, `tags`.

- **`replaces`** — 이 프리미티브가 감싸는 네이티브 HTML 태그명 (예: Button → `"button"`, Input → `"input"`). "DS 충실 사용" 린트(`templates/eslint-raw-tag-gate.mjs`)가 "프리미티브 있는데 raw 태그 박음" 을 차단할 때 이 필드에서 금지 태그를 유도. **단일 네이티브 태그를 drop-in 대체하는 경우만** 채움 — Radix 합성(select / dialog / tabs 등)처럼 단일 태그 대체가 아니면 생략.

워커는 여기까지. 검증은 메인이 모든 워커 끝난 뒤 1회.
