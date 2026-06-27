#!/usr/bin/env bash
# ui-assemble-screens.sh — 조립된 페이지에 검증 게이트를 실행한다 (결정적 사후 검증).
# eslint(raw-tag + 토큰 게이트) · prettier --check · tsc --noEmit.
set -euo pipefail

usage() {
  cat <<'EOF'
ui-assemble-screens.sh [page-file...]

조립한 페이지에 검증 게이트를 돌린다 (앱 디렉터리 기준 경로):
  - eslint  : raw HTML 태그 게이트 + DESIGN.md 토큰 게이트 (--max-warnings 0)
  - prettier: 포맷 확인 (--check)
  - tsc     : 프로젝트 전체 타입체크 (--noEmit)

앱 디렉터리는 환경변수 APP_DIR 로 지정한다 (레포 루트 기준 상대경로, 기본값 frontend).
  예: APP_DIR=apps/web bash scripts/ui-assemble-screens.sh src/pages/Home.tsx

인자 없으면 PAGES_DIR(기본값 src/pages) 전체를 lint/format 대상으로 한다.
PAGES_DIR 도 환경변수로 지정 (앱 디렉터리 기준 상대경로). Next.js app 라우터면 app 등.
  예: APP_DIR=apps/web PAGES_DIR=app bash scripts/ui-assemble-screens.sh
예: bash scripts/ui-assemble-screens.sh src/pages/ExperimentList.tsx
EOF
}

[ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ] && { usage; exit 0; }

ROOT="$(git rev-parse --show-toplevel)"
APP_DIR="${APP_DIR:-frontend}"   # 레포 루트 기준 상대경로. 시크릿 아님 — 단순 디렉터리 경로
APP_PATH="$ROOT/$APP_DIR"
[ -d "$APP_PATH" ] || { echo "✗ 앱 디렉터리 없음: $APP_PATH (APP_DIR 확인)" >&2; exit 1; }
cd "$APP_PATH"

PAGES_DIR="${PAGES_DIR:-src/pages}"   # 앱 디렉터리 기준 상대경로. Next.js app 라우터면 app 등
if [ "$#" -gt 0 ]; then
  FILES=("$@")
else
  FILES=("$PAGES_DIR")
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
