---
name: create-skill
description: 새 스킬을 만들거나 기존 스킬을 손볼 때 사용한다. 스킬 제작 원칙과 Claude Code/Codex 호환을 지키도록 돕는다.
allowed-tools: Bash, Read, Write
---

# Create Skill

새 스킬을 **스킬 제작 원칙 + Claude Code/Codex 호환**에 맞게 scaffold·검증·양쪽 설치한다.
결정적 작업은 모두 `scripts/create-skill.sh` 가 처리하고, 너는 내용만 채운다.

## 어떻게 (필요한 문서로 이동)

1. **작성 원칙** (검증 기준이자 규칙) → `references/skill-principles.md`
2. **폴더 구조 / frontmatter 공통·에이전트전용** → `references/skill-structure.md`
3. **명령 사용법** (`scaffold | verify | install`) → `bash scripts/create-skill.sh --help`
4. **처음부터 끝까지 worked example** → `references/example.md`

순서: `scaffold` → (생성된 `SKILL.md`·`references/example.md` 채우기) → `verify` (✗ 0) → `install`.
