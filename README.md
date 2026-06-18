# @swayloop/ui-agent

AI-native UI generation pipeline. Model-agnostic adapters (Claude Code / Codex / Cursor / Gemini CLI), parallel workers, automated design QA.

**Code-first.** 컴포넌트와 페이지는 코드가 SoT — `DESIGN.md` 토큰 → 코드 컴포넌트(+ manifest) → 페이지. 디자인 QA(린트)도 디자인 도구가 아니라 **코드에서 기계적으로** 검증한다: DESIGN.md 토큰 밖 클래스 차단, 그리고 프리미티브가 있는데 raw 태그를 쓴 경우(manifest `replaces` 기반)를 lint 게이트로 차단. Figma 등 시각 도구는 선택이며 SoT 가 아니다.

> Status: **0.0.x — experimental**. APIs will change.

## Docs

See [docs/AI-NATIVE-UI-PIPELINE.md](docs/AI-NATIVE-UI-PIPELINE.md) for the full architecture and rationale.

## License

MIT
