#!/usr/bin/env bash
# design-lint-gate.sh
#
# Workflow Step 4 (디자인 린트) 통과 검증 가드레일.
# 통과 시 exit 0 (허용), 실패 시 exit 2 (차단).
#
# TODO (consumer):
#   1. 린트 결과 파일 경로 결정 (예: .ui-agent/design-lint.passed)
#   2. 통과 조건 작성
#   3. 필요하면 path 별 분기 추가 (예: app/** 에 쓸 때만 게이트)
#
# 환경 변수 (Claude Code):
#   CLAUDE_PROJECT_DIR   - 프로젝트 루트
#   CLAUDE_TOOL_INPUT    - 도구 입력 (Write/Edit 시 path 포함)
#
# Codex 호환:
#   같은 스크립트를 .codex/hooks.json 의 PreToolUse 에서 호출 가능 (cp -r .claude/hooks .codex/).

set -euo pipefail

# === 예시: 페이지 코드 변환 (app/**) 진입 차단 ===
#
# if [[ "${CLAUDE_TOOL_INPUT:-}" == *"app/"* ]]; then
#   if [ ! -f "$CLAUDE_PROJECT_DIR/.ui-agent/design-lint.passed" ]; then
#     echo "blocked: run design lint (Workflow Step 4) before writing page code" >&2
#     exit 2
#   fi
# fi

exit 0  # placeholder — consumer 가 실제 로직 채움
