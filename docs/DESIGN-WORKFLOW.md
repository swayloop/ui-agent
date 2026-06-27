# Design Workflow

1인 + Figma MCP + 코딩 에이전트 (Claude / Codex) UI 디자인 표준 워크플로우. 단계 lock 됨 — 변경 시 별도 논의.

## 단계

1. **DESIGN.md / SKILL.md 준비** (사람)
   - **DESIGN.md**: 디자인 시스템 명세 (토큰 + 컴포넌트 spec + 디자인 원칙). 자체 작성 또는 기존 자산 (Awesome-Design-MD / OMD / Taste-Skill 등 — [REFERENCES.md](REFERENCES.md)) 채택. **페이지 정보 없음**
   - **SKILL.md**: AI 행동 지침 (컴포넌트 + story 동시 작성, manifest 유지 등)

2. **공통 컴포넌트 + Storybook + manifest 생성** (AI, shadcn 기반)
   - `components/ui/*.tsx` — shadcn MCP 로 설치 + 커스텀
   - `components/stories/*.stories.tsx` — 각 컴포넌트 story
   - `components.manifest.json` — Step 5 페이지 워커 입력용

3. **페이지 Figma 디자인 + flow 검토** (AI 병렬 생성 + 사람 검토)
   - Figma Make / Figma Agent 로 페이지 병렬 생성 (DESIGN.md 토큰·컴포넌트 + Figma Library 연결)
   - 사람이 전체 펼쳐놓고 UX 일관성·flow 검증
   - **페이지 인벤토리 SoT = Figma**

4. **디자인 린트 검증** (FigmaLint / Design Lint)
   - 토큰 미사용 / 스타일 누락 자동 검출 — 코드 변환 게이트

5. **공통 파일 → 페이지 병렬 코드 변환** (AI sub-agent 패턴)
   - 공통 파일 워커 1 개 → 페이지 워커 N 개 (파일 소유권 분리)
   - 워커 컨텍스트: `components/` + `stories/` + `manifest` + Figma 페이지
   - 가드레일 hook 이 Step 4 미통과 시 진입 차단

6. **코드 검증**
   - TypeScript / ESLint / build / a11y / Chromatic VRT

## ui-agent 가 ship 할 자산

`pnpm ui-agent install-skill <name>` 으로 consumer 프로젝트의 `.agents/skills/` 에 설치한다.
Claude 호환은 `.claude/skills` 심링크로 맞추며, Codex 는 `.agents/skills/` 를 직접 scan 한다.

| 자산        | 위치 (레포 루트 기준)   | 내용                                   |
| ----------- | ----------------------- | -------------------------------------- |
| `skills/*`  | `.agents/skills/<name>` | IA 작성, 공통 컴포넌트 빌드, 화면 조립 |
| `DESIGN.md` | consumer 소유           | 디자인 시스템 명세                     |

## 가드레일 hooks 패턴

- **PreToolUse + exit 2** = 차단, **exit 0** = 허용
- 가드레일 후보 (워크플로우 단계별):

| 단계       | 가드레일                                | 메커니즘                      |
| ---------- | --------------------------------------- | ----------------------------- |
| Step 2     | manifest 미등록 컴포넌트 직접 생성 차단 | PreToolUse + path 검사        |
| Step 4 → 5 | 디자인 린트 미통과 시 코드 변환 차단    | consumer hook                 |
| Step 5     | 워커가 다른 워커 소유 파일 수정 차단    | PreToolUse + path 소유권 검사 |
| Step 6     | Write 후 자동 prettier / typecheck      | PostToolUse                   |

hook 은 consumer 가 필요 시 추가.

## Locked decisions

- **Figma MCP** = baseline (any MCP client)
- **코딩 에이전트** = Claude primary + Codex 폴백. 자산 cross-vendor 호환 필수
- **shadcn-style distribution** = consumer-owned files, 선택적 update (CLI 동작 deferred)
- **shadcn = 컴포넌트 베이스** (MCP 로 설치, AI 임의 생성 X)
- **Storybook** = 컴포넌트와 함께 생성 (AI 시각 컨텍스트 + VRT)
- **페이지 인벤토리 SoT** = Figma (DESIGN.md 아님)
- **AGENTS.md** = consumer 책임, ui-agent ship X
- **Cursor Rules / AGENTS.md hierarchical** = 사용 안 함
- **DESIGN.md 본문** = consumer 책임

## Out of scope (deferred)

- shadcn-style CLI `add` / `update` / `diff` 명령 구현
- npm publish 모델
- 빌드 파이프라인 자동화 (`tokens` / `components` / `pages` / `qa` 명령, 어댑터, 오케스트레이터)
- Codex `.codex/skills/` `.codex/hooks/` 직접 ship
- DayDot 적용
