#!/usr/bin/env bash
# ui-assemble-screens.sh — 조립된 페이지에 검증 게이트를 실행한다 (결정적 사후 검증).
# eslint(raw-tag + 토큰 게이트) · prettier --check · tsc --noEmit.
set -euo pipefail

usage() {
  cat <<'EOF'
ui-assemble-screens.sh [page-file...]

조립한 페이지에 검증 게이트를 돌린다 (frontend/ 기준 경로):
  - eslint  : raw HTML 태그 게이트 + DESIGN.md 토큰 게이트 (--max-warnings 0)
  - prettier: 포맷 확인 (--check)
  - tsc     : 프로젝트 전체 타입체크 (--noEmit)

인자 없으면 src/pages 전체를 lint/format 대상으로 한다.
예: bash scripts/ui-assemble-screens.sh src/pages/ExperimentList.tsx
EOF
}

[ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ] && { usage; exit 0; }

ROOT="$(git rev-parse --show-toplevel)"
FRONTEND="$ROOT/frontend"
cd "$FRONTEND"

if [ "$#" -gt 0 ]; then
  FILES=("$@")
else
  FILES=("src/pages")
fi

fail=0
echo "▶ eslint (raw-tag·토큰 게이트)"
pnpm exec eslint --max-warnings 0 --no-warn-ignored "${FILES[@]}" || fail=1

echo "▶ prettier --check"
pnpm exec prettier --check "${FILES[@]}" || fail=1

echo "▶ tsc --noEmit"
pnpm exec tsc --noEmit || fail=1

if [ "$fail" -ne 0 ]; then
  echo "✗ 게이트 실패 — 위 항목을 고치세요." >&2
  exit 1
fi
echo "✓ 게이트 통과 (eslint · prettier · tsc)"
