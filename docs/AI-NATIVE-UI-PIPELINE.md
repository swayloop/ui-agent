# AI-Native UI Pipeline (`@swayloop/ui-agent`)

## 0. Background

1인 개발자가 AI를 활용해 웹사이트를 디자인하는 과정에서, DESIGN.md와 SKILL.md를 공통 컨텍스트로 제공하고 디자인 일관성을 유지하기 위한 공통 컴포넌트를 구축하는 등 반복적으로 수행되는 작업들을 하나의 플로우로 표준화하고 제어하고자 했다.

또한 AI 모델의 토큰 한도로 인해 작업 도중 Claude Code가 중단될 경우 Codex 등 다른 모델로 작업을 위임해야 하는 상황이 자주 발생했고, 이 과정에서 동일한 컨텍스트를 반복적으로 재주입해야 하는 비효율이 존재했다.

현재 AI 기반 디자인 및 UI 생성 workflow는 아직 실험적인 단계에 있으며, 최적의 협업 방식과 생성 프로세스를 지속적으로 탐색하고 있다. 이에 따라 변화하는 프로세스를 여러 프로젝트에 동시에 적용할 수 있도록, 디자인 시스템·컴포넌트·컨텍스트·검증 로직을 하나의 에이전트 기반 파이프라인으로 통합 관리하고자 한다.

## 1. Goal

- UI/UX 일관성 유지
- 디자인 시스템 기반 자동 생성
- 병렬 페이지 생성
- 모델 교체 가능한 구조 (config 한 줄로 워커 agent 교체)
- 자동 디자인 QA / Validation

3개 프로젝트가 동일한 파이프라인을 공유한다. 배포 단위는 npm 패키지 **`@swayloop/ui-agent`**.

---

## 2. Architecture Overview

### 2.1 데이터 흐름

```
[ 외부 입력 — 사람이 작성·관리 ]
  DESIGN.md  +  SKILL.md  +  ui-agent.config.json
                  │
                  ▼
   ┌─────────────────────────────────────────────────────┐
   │  @swayloop/ui-agent  (CLI: 단계 = 명령)             │
   │                                                     │
   │   ui-agent tokens                                   │
   │        ↓                                            │
   │     tokens.json                                     │
   │        ↓                                            │
   │   ui-agent components                               │
   │        ↓                                            │
   │     components/ + manifest  ──→ Storybook            │
   │                              ──→ Figma Library (옵션)│
   │        ↓                                            │
   │   ui-agent pages   (worktree 격리, 병렬)            │
   │        ↓                                            │
   │     app/<route>/*                                   │
   │        ↓                                            │
   │   ui-agent qa     (lint / a11y / responsive / visual)│
   │        ↓                                            │
   │     QA Report                                       │
   └─────────────────────────────────────────────────────┘
                       │
                       ▼
                Human Review
```

각 명령은 멱등(산출물 있으면 skip, `--force`로 재생성). 사용자가 단계별로 호출하며, 체이닝은 `&&`로 직접.

### 2.2 설계 요점

1. **입력은 사람이 쓰는 3개 파일뿐** — `DESIGN.md`, `SKILL.md`, `ui-agent.config.json`. 나머지(`tokens.json`, `components/`, `manifest`, pages)는 모두 agent 산출물.
2. **단계 = 명령.** `tokens` / `components` / `pages` / `qa` 각각 독립 실행 가능. 편의 wrapper(`all` 같은 것)는 두지 않는다 — 사용자가 명시적으로 단계를 제어.
3. **AI Runtime Layer는 모든 명령이 공유.** Prompts(공통 자산) / Adapters(agent별 얇은 래퍼) / Orchestrator(worktree·병렬). 모델 독립성의 핵심.
4. **Component Registry ≠ Storybook.** Storybook과 Figma Library는 *컴포넌트의 시각화 산출물*(사람·QA용)이지 AI Runtime의 입력이 아니다. AI 워커는 `components.manifest.json`만 본다.
5. **MCP 서버는 옵션.** §4 참고.

---

## 3. Layer 별 상세

### 3.1 외부 입력 (3개 파일)

사람이 작성·관리하는 유일한 자산.

**(a) `DESIGN.md`** — 디자인 목표, 원칙, 컴포넌트·페이지 목록의 단일 SoT.

하이브리드 스키마:

- **frontmatter 고정**: `version`, `framework`, `design_system`
- **헤더 고정**: `## Principles`, `## Components`, `## Pages`
- **본문 자유**

예:

```markdown
---
version: 1
framework: next
design_system: shadcn
---

## Principles

- 모바일 우선
- 다크모드 기본

## Components

- Button (variant: default | destructive | ghost)
- Card
- DataTable

## Pages

### /dashboard

- 좌측 사이드바, 상단 헤더, 메인 차트 영역
- 카드 4개(KPI), 차트 2개(주간 트렌드)
- 필수 컴포넌트: KPICard, LineChart, Sidebar

### /settings

...
```

**(b) `SKILL.md`** — agent가 따라야 할 코딩·디자인 컨벤션, 금지사항, tone.

DESIGN.md가 *무엇을* 만들지라면 SKILL.md는 *어떻게* 만들지. 모든 명령이 공통으로 주입한다.

**(c) `ui-agent.config.json`** — 경로·워커 agent·QA 옵션. §5 참고.

### 3.2 CLI 명령 surface

각 명령은 한 단계만 책임진다.

| 명령 | 입력 | 출력 | 병렬화 | 멱등 동작 |
|---|---|---|---|---|
| `ui-agent init` | (대화형) | `DESIGN.md`, `SKILL.md`, `ui-agent.config.json` | — | 기존 파일 보존 |
| `ui-agent tokens` | DESIGN.md + SKILL.md | `tokens.json` (+ globals.css / tailwind config) | 단일 호출 | 있으면 skip, `--force`로 재생성 |
| `ui-agent components [names...]` | DESIGN.md + SKILL.md + tokens.json | `components/ui/*.tsx` + stories + `components.manifest.json` | **컴포넌트별 병렬 워커** | 컴포넌트별 독립 멱등 |
| `ui-agent pages [routes...]` | 위 전부 | `app/<route>/*` | **페이지별 병렬 워커** | 페이지별 독립 멱등 |
| `ui-agent qa` | 위 전부 + 생성물 | QA report | 검사 종류별 병렬 | 항상 실행 |
| `ui-agent status` | — | 단계별 산출물 존재 여부 + DESIGN.md 변경 후 stale 여부 | — | — |

체이닝이 필요하면 사용자가 `&&`로. 패키지는 `all` 같은 wrapper를 두지 않는다.

### 3.3 `tokens` 단계

- DESIGN.md의 `## Principles`와 SKILL.md를 읽어 W3C DTCG 포맷의 `tokens.json`을 생성.
- **베이스라인은 shadcn 기본 토큰을 시드로 두고 DESIGN.md 의도를 diff로 얹는 방식** — LLM이 0부터 토큰 세트를 짜지 않게 해서 안정성 확보.
- 부수 산출물: 변환된 `globals.css` / Tailwind config (consumer 경로는 config가 지정).
- 단일 호출이라 워커 1개. 결과는 일관성이 가장 중요하므로 비결정성 최소화.

### 3.4 `components` 단계 (병렬)

DESIGN.md의 `## Components` 섹션 + tokens.json + SKILL.md를 읽어 컴포넌트 셋과 manifest를 만든다. **컴포넌트 N개를 N개 워커로 병렬 생성**.

산출물 구조:

```
components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── stories/
│   ├── button.stories.tsx
│   └── ...
└── components.manifest.json   ← AI 워커의 유일한 컴포넌트 인덱스
```

`components.manifest.json` 스키마:

```json
{
  "version": "1.0.0",
  "components": [
    {
      "name": "Button",
      "source": "components/ui/button.tsx",
      "story": "components/stories/button.stories.tsx",
      "props": { "variant": ["default","destructive","ghost"], "size": ["sm","md","lg"] },
      "slots": ["children"],
      "examples": ["examples/button-primary.tsx"],
      "tags": ["form","action"]
    }
  ]
}
```

**병렬화 contract** — 각 컴포넌트 워커는 자기 이름의 파일만 작성:

```
components/ui/<name>.tsx
components/stories/<name>.stories.tsx
```

다른 컴포넌트 파일·tokens·다른 페이지는 절대 건드리지 않음. manifest는 모든 워커 종료 후 orchestrator가 합쳐 1회 작성.

**Storybook 연동.** 컴포넌트 생성·갱신 시 story 파일을 함께 만든다. Storybook은 사람·VRT용 *side output* — AI 워커는 보지 않는다.

**Figma Library 미러 (선택).** config의 `figma.syncLibrary: true`면 manifest를 Figma Variables/Components로 미러. Figma MCP의 `create_new_file` / `use_figma` / `generate_figma_design` 활용.

### 3.5 `pages` 단계 (병렬)

워커들이 worktree에 격리되어 페이지를 병렬 생성.

**Worker I/O Contract** (충돌 없는 병렬화의 핵심):

워커가 받는 입력:

```
.ui-agent/workspace/<page-id>/
├── system.md                  # 00-system.md
├── skill.md                   # SKILL.md 사본
├── task.md                    # 30-build-page.md + 페이지별 spec
├── tokens.json                # 토큰 스냅샷
├── components.manifest.json   # 컴포넌트 인덱스
├── allowed-components.txt     # 이 페이지에서 허용된 컴포넌트만
├── examples/                  # 유사 페이지 예제 (3개 미만)
└── figma-mockup.png?          # 있으면 참조용
```

워커가 만들 수 있는 출력 (그 외 경로 금지):

```
app/<route>/                   # Next.js 가정
├── page.tsx
├── components/                # 페이지 전용 컴포넌트만
└── __tests__/page.test.tsx
```

규칙:

- 공용 컴포넌트(`components/ui/**`) 절대 수정 금지.
- 다른 페이지 디렉토리 절대 수정 금지.
- 토큰·manifest·SKILL.md 절대 수정 금지.
- 새 토큰/컴포넌트가 필요하면 결과 JSON에 `proposed_tokens` / `proposed_components`로 *보고만*. 사람이 검토 후 `ui-agent tokens --force` 또는 `components --force`로 재생성하거나 수동 수정.

**Figma Page Mockup (선택).** config의 `figma.generateMockups: true`면 페이지 spec을 Figma에 시안으로 띄움. 워커는 이 시안을 *참고*(`get_design_context`)만 함.

### 3.6 `qa` 단계

자동 검사 4종 (config로 on/off):

1. **Design Lint** (커스텀 ESLint plugin):
   - 색상·간격·radius 하드코딩 금지 → 토큰만 사용
   - manifest에 없는 ad-hoc 컴포넌트 정의 감지
   - `allowed-components` 위반 감지

2. **Visual QA**:
   - Storybook + Chromatic으로 컴포넌트 회귀
   - Figma mockup이 있으면 페이지 스크린샷 vs Figma 스크린샷 픽셀/구조 diff (Figma MCP `get_screenshot`)

3. **Accessibility QA**: `@axe-core/playwright`로 페이지 자동 크롤.

4. **Responsive Lint**: 정의된 breakpoint에서 overflow / clipping 자동 감지(Playwright).

검사 4종은 서로 독립이라 병렬 실행. 실패는 결과에 attach → 자동 재시도 1회 → 그래도 실패하면 Human Review 큐.

### 3.7 AI Runtime Layer ★ (공통 인프라)

위 모든 명령(`tokens` / `components` / `pages` / `qa`)이 *공유*하는 인프라. 3조각.

#### 3.7.1 Prompts (공통)

```
runtime/prompts/
├── 00-system.md           # 디자인 원칙·금지사항·tone (모든 명령 공통)
├── 10-gen-tokens.md       # tokens 명령용
├── 20-gen-component.md    # components 명령의 워커용 (컴포넌트 1개씩)
├── 30-build-page.md       # pages 명령의 워커용 (페이지 1개씩)
├── 40-design-lint.md      # qa: design lint
└── 41-visual-qa.md        # qa: visual diff
```

전부 plain markdown. agent별 분기 없음.

#### 3.7.2 Adapters (agent별 얇은 셸 래퍼)

각 어댑터는 **동일한 인터페이스**를 제공:

```bash
runtime/adapters/<agent>.sh \
  --prompt-file <md> \
  --context-dir <dir>     # 워커에 주입할 파일들
  --working-dir <dir>     # 워커가 작업할 worktree
  --output-format json
```

내부 구현(요약):

| Agent       | 헤드리스 호출                                                    | JSON 출력     |
| ----------- | ---------------------------------------------------------------- | ------------- |
| Claude Code | `claude -p "<prompt>" --output-format stream-json`               | NDJSON 스트림 |
| Codex       | `codex exec --json "<prompt>"` 또는 `... exec -` (stdin)         | NDJSON 스트림 |
| Cursor      | `cursor-agent -p "<prompt>" --output-format stream-json --force` | NDJSON 스트림 |
| Gemini CLI  | `gemini --prompt "<prompt>"` (헤드리스)                          | JSON          |

어댑터는 prompt-file + context-dir에서 컨텍스트를 합쳐 stdin/인자로 넘기고, 결과 JSON에서 final answer + 변경 파일 목록을 추출해 표준화한 형태로 반환.

#### 3.7.3 Orchestrator

```
runtime/orchestrator.sh
```

역할:

1. config 파싱 → 워커 agent 결정
2. 단위(컴포넌트·페이지) 목록을 DESIGN.md에서 파싱
3. 각 단위마다 `git worktree add`로 격리된 작업 공간 생성 (또는 `pages`처럼 dir-scope만 필요한 경우 sandbox dir로 대체)
4. 워커 컨텍스트 디렉토리 구성 (위 contract)
5. N개 워커를 병렬 spawn (`xargs -P` 또는 GNU parallel)
6. 결과 수합 → manifest 갱신(컴포넌트) 또는 머지(페이지)
7. 다음 명령은 사용자가 직접 호출. orchestrator는 자동 chain 안 함.

orchestrator는 어떤 agent인지 모른다. config의 `worker.agent`로 어댑터 선택.

---

## 4. AI Runtime 어댑터 결정: stdin/stdout vs MCP

### 4.1 결론

**stdin/stdout 셸 래퍼가 primary**. MCP 서버는 _선택적 보조 레이어_.

### 4.2 근거 (리서치 기반, 2026-05 기준)

**4개 주요 CLI agent 모두 헤드리스 + JSON 출력을 지원한다.**

- **Claude Code**: `claude -p --output-format json|stream-json`. 가장 오래되고 성숙.
- **Codex (Rust 재작성, v0.13x)**: `codex exec --json`. stdin 입력은 `codex exec -` 또는 prompt 인자 + 파이프 컨텍스트. 단, `codex exec`가 TTY 미부착 환경에서 무음 크래시하는 회귀 이슈가 보고된 적 있음 → orchestrator는 PTY를 강제하거나 stderr 캡처 필수.
- **Cursor**: `cursor-agent -p --output-format json|stream-json`. 헤드리스 hang 이슈가 있었으나 `--force`로 workspace trust 우회. JSONL transcript 저장.
- **Gemini CLI**: 헤드리스 지원, 웹툴은 내장.

→ **어떤 agent든 같은 패턴**(stdin/argv prompt → stdout NDJSON → exit code). 셸 래퍼면 충분.

**MCP는 모두 지원하지만 비대칭이 크다.**

- Claude Code: 가장 성숙. 1,000+ 커뮤니티 서버. 네이티브.
- Codex: 지원하지만 생태계는 더 작음.
- Cursor: 지원하지만 **활성 MCP 툴 ~40개 소프트 한계**. 넘으면 모델이 조용히 일부 툴을 잃거나 잘못 선택하기 시작.
- Gemini CLI: 지원, 캐치업 단계.

→ MCP에 핵심 경로를 의존시키면 **(a) 비 Claude agent에서 신뢰성 하락**, **(b) Cursor 등에서 툴 ceiling에 부딪힘**.

**Orchestration은 MCP로 표현하기 부자연스럽다.**

- 워크트리 생성, 워커 프로세스 spawn, exit code 회수, 동시성 제어 — 전부 프로세스/파일시스템 차원. MCP 서버는 자기가 호출되는 컨텍스트 안에서만 동작하지, 워커 프로세스를 직접 띄울 수 없다.
- 즉 orchestrator가 셸이면 자연스럽고, MCP면 우회 설계가 필요.

**Static 컨텍스트(토큰·manifest)는 파일 주입이 MCP 툴콜보다 항상 우위.**

- 파일로 주면: 1회 컨텍스트 로드, 워커가 _무조건_ 본다. deterministic.
- MCP 툴로 주면: 워커가 *호출하기로 결정*해야만 본다. 누락 위험 + 매 호출 라운드트립 비용.

### 4.3 MCP가 정당화되는 좁은 영역

다음 중 하나가 강한 신호일 때만 MCP 서버를 추가:

1. **Registry가 거대해서 매번 다 주입하면 context window 낭비**가 명백할 때 (컴포넌트 200개+ 등).
2. **워커 실행 도중 동적 쿼리**가 필요할 때 (예: "warning 톤의 카드 variant가 있나?" 같은 탐색형 쿼리를 워커가 자율적으로 던지게 하고 싶을 때).
3. **여러 워커가 공유하는 가벼운 휘발성 상태**(예: 락, 토큰 변경 제안 수합)가 필요할 때.

위 3가지가 모두 아니라면 **파일 주입으로 충분**.

### 4.4 권장 구성

```
runtime/
├── adapters/
│   ├── claude.sh
│   ├── codex.sh
│   ├── cursor.sh
│   └── gemini.sh
├── orchestrator.sh
├── prompts/
│   ├── 00-system.md
│   ├── 10-build-component.md
│   ├── 20-build-page.md
│   ├── 30-design-lint.md
│   └── 40-visual-qa.md
└── mcp/                       # 선택 — Phase 2에서 추가
    └── design-registry/
        ├── server.ts          # tokens / manifest / examples를 read-only로
        └── package.json
```

`mcp/`는 처음엔 비워두고, 위 4.3 신호가 실제로 발생하면 그 시점에 추가.

---

## 5. Repo / 패키지 구조 제안

배포 단위는 npm 패키지 1개. consumer 프로젝트는 의존성 + `ui-agent.config.json`만 추가.

```
@swayloop/ui-agent                     # npm 패키지
├── bin/
│   └── ui-agent                       # CLI 진입점
├── src/
│   └── commands/                      # init / tokens / components / pages / qa / status
├── runtime/                           # §3.7 — 모든 명령이 공유
│   ├── prompts/
│   ├── adapters/
│   ├── orchestrator.sh
│   └── (선택) mcp/
├── templates/
│   ├── DESIGN.md.tpl
│   ├── SKILL.md.tpl
│   └── ui-agent.config.json.tpl
├── schema/
│   └── ui-agent.config.schema.json    # JSON Schema (편집기 자동완성)
└── package.json
```

각 프로젝트에서:

```bash
pnpm add -D @swayloop/ui-agent
pnpm ui-agent init
# → ./design/DESIGN.md, ./design/SKILL.md, ./ui-agent.config.json 생성
```

이후 사용:

```bash
pnpm ui-agent tokens                # tokens.json 생성
pnpm ui-agent components            # 컴포넌트 셋 병렬 생성
pnpm ui-agent components Button     # 특정 컴포넌트만
pnpm ui-agent pages                 # 페이지 병렬 생성
pnpm ui-agent pages /dashboard      # 특정 페이지만
pnpm ui-agent qa                    # QA
pnpm ui-agent status                # 단계별 진행 상황
```

설정 파일 (`ui-agent.config.json`, cwd 기준):

```json
{
   "$schema": "./node_modules/@swayloop/ui-agent/schema/ui-agent.config.schema.json",
   "framework": "next",
   "designSystem": "shadcn",
   "paths": {
      "designSpec": "design/DESIGN.md",
      "skill": "design/SKILL.md",
      "tokens": "design/tokens.json",
      "componentsDir": "components/ui",
      "storiesDir": "components/stories",
      "manifest": "components/components.manifest.json",
      "outputRoot": "app"
   },
   "worker": {
      "agent": "claude",
      "parallelism": 4,
      "isolation": "worktree"
   },
   "figma": {
      "fileKey": null,
      "syncLibrary": false,
      "generateMockups": false
   },
   "qa": {
      "designLint": true,
      "a11y": true,
      "responsive": true,
      "visualDiff": false,
      "retryOnFail": 1
   }
}
```

3개 프로젝트는 이 패키지를 의존성으로 두고 config만 다르게 가져간다. 파이프라인 자체 갱신은 패키지 버전 업으로 일괄.

---

## 6. 구현 전략 (Phase 기반)

> **원칙**: 한 프로젝트에서 dirty path로 끝까지 동작시킨 뒤, 두 번째 사용처에 들어갈 때 공통부만 추출해 패키지화. 추상화는 페인이 실재할 때 트리거 기반으로 추가. "혹시 필요할까봐" 짓지 않는다.

설계 자체(§1~§5)는 최종 그림이지만, **그 모양으로 처음부터 짓지는 않는다**. 솔로 개발자에게 미리 만든 추상화는 6개월치 미래 비용을 오늘 결제하는 것과 같다. Phase 단계를 건너뛰지 말 것.

### Phase 0 — Dogfood in UXResearchEngine (현재)

`UXResearchEngine` 프로젝트 안에 hardcoded shell script 4개로 전체 플로우 동작. 패키지로 빼지 않음.

```
UXResearchEngine/
├── scripts/
│   ├── gen-tokens.sh
│   ├── gen-components.sh
│   ├── gen-pages.sh
│   └── qa.sh
└── design/
    ├── DESIGN.md
    └── SKILL.md
```

**제약 (의도적 생략)**

- Claude 1개만 호출 (`claude -p` 직접). 어댑터 추상화 X
- 순차 실행. worktree·병렬화 X
- MCP X — 파일 주입만
- 패키지화·config schema·다중 framework 지원 X
- 파일 경로·프롬프트 텍스트 전부 스크립트에 하드코딩

**완료 조건** — tokens → components → pages → qa 한 사이클이 end-to-end로 통과해 실제 페이지 1~2개를 손으로 짜지 않고 배포 직전까지 가져감. 이 과정에서 **진짜 어려운 게 무엇인지** (어떤 프롬프트가 잘 안 먹는지, 어디서 일관성이 깨지는지) 가 보임 — 이게 추상화보다 훨씬 가치 있는 정보.

### Phase 1 — Extract to `@swayloop/ui-agent` (트리거: 2번째 프로젝트 시작)

UXResearchEngine 스크립트와 2번째 프로젝트의 요구를 diff → **동일한 부분만** 패키지로 추출. 이미 만들어둔 `init` 명령 + 템플릿 + config schema (커밋 c7b54cf) 위에 얹는다.

추출 우선순위:

1. **프롬프트** (`runtime/prompts/`) — 가장 재사용 가능, 가장 빨리 추출
2. **단계별 CLI 명령** (`tokens` / `components` / `pages` / `qa`) — 인터페이스 표준화
3. **Worker I/O Contract** (§3.5) — 워커 입력 디렉토리 구조 + 출력 경로 제약

**여전히 미루는 것** — adapter 인터페이스(아직 Claude 1개), worktree 병렬화, MCP. Phase 2~4 트리거가 실제로 오면 그때.

### Phase 2 — Adapter 추상화 (트리거: Claude 토큰 한도가 자주 막힘)

`runtime/adapters/claude.sh` + `codex.sh` 두 개를 동일 인터페이스(§3.7.2)로 만든다. 같은 컴포넌트/페이지를 두 어댑터로 돌려 결과 동등성을 검증해야 인터페이스가 진짜 어댑터 가능한지 확인됨. Cursor/Gemini는 더 미룬다.

### Phase 3 — 병렬화 (트리거: 순차 생성이 체감상 느림)

`git worktree` + `xargs -P` orchestrator. components 먼저(파일 격리 단순), pages는 그 다음(라우트 디렉토리 격리). Worker I/O Contract의 "허용 출력 경로" 제약을 강제하는 lint도 같이.

### Phase 4 — 선택 기능 (각 트리거 발생 시)

| 기능 | 트리거 |
| --- | --- |
| Figma Library 미러 (code → Figma) | 디자인 산출물을 디자이너/PM과 Figma에서 공유할 필요 발생 |
| Visual QA (Chromatic) | Design Lint만으로 못 잡는 시각 회귀가 실제 발생 |
| a11y / Responsive QA | 접근성/반응형 회귀가 실제 보고됨 |
| MCP `design-registry` | §4.3 신호 (컴포넌트 200+ 등) 실제 발생 |

**핵심** — design doc에 적혀 있다고 지금 만들 이유 아님. 위 표의 트리거는 가설이 아니라 **실제 발생 여부**로 판단.

---

## 7. 미해결 / 결정 필요

**결정된 항목 (참고)**
- ✅ 워커 agent 결정: `ui-agent.config.json`의 `worker.agent` 키. 기본값 `claude`. 프로젝트별 고정.
- ✅ 토큰/컴포넌트 변경 권한: 워커는 `proposed_*`로 보고만. 사람이 직접 수정하거나 `--force`로 재생성. 워커가 직접 토큰/공용 컴포넌트 수정 금지.
- ✅ 단계 구조: 명령 단위로 분리 (`tokens` / `components` / `pages` / `qa`). 편의 wrapper 없음.

**미해결**
- [ ] 3개 프로젝트의 스택이 동일한가? (Next.js 한정? RN 포함?) — 다르면 framework adapter 필요
- [ ] 디자인 시스템: shadcn 고정인가, 프로젝트별로 다른가? — 다르면 components 단계의 시드 layer 추상화 필요
- [ ] Figma 시안 생성(`figma.generateMockups`)을 모든 프로젝트에 켤지, 일부만 켤지 — 기본 OFF
- [ ] QA 재시도 한도: 현재 1회 default. 2회까지 늘릴지
- [ ] `DESIGN.md`를 단일 파일로 둘지, 분할 허용할지 (`design/pages/*.md`) — 페이지 수가 많아지면 단일 파일이 무거워짐
- [ ] 워커가 stuck/timeout 됐을 때 정책 (kill·재시도·로그)

---

## References (조사 출처)

- Codex 비대화형 모드: <https://developers.openai.com/codex/noninteractive>
- Codex CLI reference: <https://developers.openai.com/codex/cli/reference>
- Claude Code headless: <https://code.claude.com/docs/en/headless>
- Cursor CLI headless: <https://cursor.com/docs/cli/headless>
- MCP 비교 (2026): <https://www.totalum.app/blog/best-mcp-servers-2026>
- Cursor 툴 ceiling 등 비교: <https://codersera.com/blog/best-mcp-servers-claude-code-cursor-2026/>
- AGENTS.md / Skills / Cursor Rules 비교: <https://www.agensi.io/learn/ai-coding-tools-comparison-2026>
