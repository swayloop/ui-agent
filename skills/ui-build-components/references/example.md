# Button 컴포넌트 워크플로우 (한 라운드)

`DESIGN.md` (consumer repo 안 위치 가변 — UXResearchEngine 의 경우 `frontend/DESIGN.md`) 의 디자인 결정을 Tailwind 클래스로 변환하는 한 라운드.

## 0. 전제

### DESIGN.md — AI 의 판단 근거

먼저 위치 발견:

```bash
$ find . -name DESIGN.md -not -path '*/node_modules/*'
./frontend/DESIGN.md
```

→ 못 찾으면 사람에게 경로 묻기. 찾은 `DESIGN.md` 에서 이번 컴포넌트 관련 토큰 / variant / 원칙 추출. 예 (UXResearchEngine):

```markdown
## Colors

- primary: #0066cc # 기본 CTA. interactive 한 액션
- on-primary: #ffffff # primary 위 텍스트
- ink: #1d1d1f # 본문 텍스트
- surface-pearl: #fafafc # ghost / 보조 hover 배경
- ...

## Components

- Button (variant: default | ghost | destructive; size: md | sm)
  - default: primary 면 + on-primary 텍스트
  - ghost: 투명, ink 텍스트, surface-pearl hover
  - destructive: 빨강 계열
```

→ AI 가 이 결정 (어떤 토큰 / 어떤 variant / 어떤 상호작용) 을 보고 작업.

### 인프라 — AI 가 직접 만지지 않음

Tailwind 가 인식하는 `@theme` CSS 가 consumer 의 인프라에 있어야 함 (theme.css / index.css / 어디든). step 1 (`pnpm ui-agent tokens --format css-tailwind`) 결과를 쓰거나 consumer 가 직접 관리. AI 는 Tailwind 가 `bg-primary` 같은 클래스를 인식한다는 것만 전제로 함.

### shadcn CLI + 네트워크 allowlist 확인 (샌드박스 환경)

```bash
$ pnpm dlx shadcn --version 2>/dev/null && echo OK || echo "shadcn CLI 실행 권한 없음 — 사람에게 허용 요청"
```

샌드박스 / 백그라운드 에이전트 환경에선 다음 도메인 allowlist 명시 필요:

- `ui.shadcn.com` (컴포넌트 fetch)
- `registry.npmjs.org` (pnpm dlx 의 패키지 다운로드)

권한 거부는 간헐적일 수 있으니 step 2 fetch 시 2~3회 재시도 후 사람 보고 (첫 거부로 멈추면 false negative).

### Storybook 설치 확인

```bash
$ ls .storybook/ 2>/dev/null || grep -q '"@storybook' package.json && echo OK || echo "Storybook 없음 — 설치 안내"
```

미설치 시:

```bash
pnpm dlx storybook@latest init
```

거부 / 보류면 아래 step 4 (story 작성) skip.

> 검증 도구 (`eslint-plugin-better-tailwindcss`, `@storybook/test-runner`, `axe-playwright` 등) 의 설치 / 설정은 verify SKILL (#39) 의 영역. 이 SKILL 은 빌드만 책임.

## 1. DESIGN.md 에서 결정 추출

이번 라운드 (Button): primary / on-primary / ink / surface-pearl + 3 variants × 2 sizes.

## 2. CLI 로 베이스 fetch

```bash
$ pnpm dlx shadcn add button
# → components/ui/button.tsx 생성
```

샌드박스에서 권한/네트워크 거부 시 2~3회 재시도 후 사람 보고. (MCP 는 메타데이터만 주고 소스 본문을 안 줘서 fetch 는 항상 CLI 가 담당.)

## 3. 컴포넌트 본문 — 베이스 정화 + DESIGN.md 결정을 Tailwind 클래스로

shadcn 베이스에는 우리 DESIGN.md 와 무관한 표현이 섞여 옴:

- 표준 shadcn 스타일 (예: `shadow-sm`, `border` 기본값) — DESIGN.md 가 명시적으로 금지한 항목이면 제거
- 디자인 값을 하드코딩한 arbitrary (예: `grid-rows-[auto_auto]`, `h-[44px]`, `bg-[#hex]`) — step 6 lint 가 에러로 잡지만 여기서 미리 정리
- 디자인 원칙 어긋난 표현 (예: 우리는 elevation 대신 border 로 구분한다면 모든 `shadow-*` 제거)

> **carve-out**: 프레임워크가 런타임에 채우는 CSS var 는 기능적 plumbing 이라 **유지**. 예: radix 의 `min-w-[var(--radix-select-trigger-width)]` 를 지우면 Select 드롭다운 너비가 깨진다. 이런 줄은 `// eslint-disable-next-line better-tailwindcss/no-restricted-classes` 로 lint 만 명시적으로 우회 (디자인 값 하드코딩 / 프레임워크 plumbing 을 코드에서 구분).

베이스를 정화한 다음 DESIGN.md 결정을 토큰 클래스로 매핑:

`components/ui/button.tsx`:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50',
  {
    variants: {
      variant: {
        // DESIGN.md → primary + on-primary
        default: 'bg-primary text-on-primary hover:bg-primary-focus',
        // DESIGN.md → 투명 + ink 텍스트 + surface-pearl hover
        ghost: 'text-ink hover:bg-surface-pearl',
        // DESIGN.md → destructive (예: danger 토큰이 정의되어 있을 때)
        destructive: 'bg-danger text-on-danger hover:bg-danger-focus',
      },
      size: {
        md: 'h-10 px-4 text-sm',
        sm: 'h-8 px-3 text-xs',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

→ DESIGN.md 의 결정 (어떤 토큰) ↔ 클래스 (`bg-primary`, `text-on-primary`) 1:1 매핑. **arbitrary value 없음**. DESIGN.md 에 없는 토큰 (예: `danger`) 이 필요하면 작성 멈추고 사람 보고 — SKILL 이 임의로 토큰 추가하지 않음.

## 4. Storybook story

`components/stories/button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../ui/button';

const meta: Meta<typeof Button> = { component: Button };
export default meta;

export const Default: StoryObj<typeof Button> = { args: { children: 'Click' } };
export const Ghost: StoryObj<typeof Button> = { args: { variant: 'ghost', children: 'Ghost' } };
export const Destructive: StoryObj<typeof Button> = {
  args: { variant: 'destructive', children: 'Delete' },
};
```

## 5. manifest 작성

`components/ui/button.manifest.json` (컴포넌트 옆에 분산 저장 — 병렬 작업 충돌 회피):

```json
{
  "name": "Button",
  "path": "components/ui/button.tsx",
  "variants": ["default", "ghost", "destructive"],
  "sizes": ["md", "sm"],
  "slots": [],
  "tags": ["interactive", "cta"]
}
```

→ 한 컴포넌트당 한 파일. 전체 집계 (`components.manifest.json` 생성 등) 는 별도 도구의 몫.

## 6. 검증은 verify SKILL (#39) 의 몫

이 SKILL 은 step 5 (manifest 작성) 까지로 끝. prettier / eslint (`better-tailwindcss`) / `@storybook/test-runner` + `axe-playwright` 의 셋업 / 실행 / fail 보고는 verify SKILL 책임 — storybook 서버 + Chromium 비용 때문에 컴포넌트마다 도는 건 비효율, 중앙에서 1회 트리거.

> 한계: axe 는 `::placeholder` 같은 가상요소 대비를 못 잡음. 대비 회귀의 보조 게이트이지 a11y 전반 보증 아님 — 가상요소 / 동적 상태는 사람이 storybook 켜고 확인 (이 노트는 verify SKILL 에서 다시 명시).
