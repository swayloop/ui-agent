#!/usr/bin/env bash
# ui-build-components.sh — 빌드된 컴포넌트에 검증 게이트를 실행한다 (결정적 사후 검증).
# prettier --check · eslint(토큰 게이트) · test-storybook(axe a11y, 있을 때).
# 워커 병렬 빌드가 모두 끝난 뒤 메인 에이전트가 1회 트리거 (main-flow.md 3절).
set -euo pipefail

usage() {
  cat <<'EOF'
ui-build-components.sh [path...]

빌드된 컴포넌트에 검증 게이트를 돌린다 (앱 디렉터리 기준 경로):
  - prettier     : 포맷 확인 (--check)
  - eslint       : DESIGN.md/@theme 토큰 게이트 + arbitrary value 차단 (--max-warnings 0)
  - test-storybook: axe 훅으로 a11y(대비 등) 검사 — Storybook 있을 때만

앱 디렉터리는 환경변수 APP_DIR 로 지정한다 (레포 루트 기준 상대경로, 기본값 frontend).
  예: APP_DIR=apps/web bash scripts/ui-build-components.sh

인자 없으면 UI_DIR(기본값 components/ui) + STORIES_DIR(기본값 components/stories) 를
lint/format 대상으로 한다. 둘 다 환경변수로 지정 (앱 디렉터리 기준 상대경로).
  예: APP_DIR=apps/web UI_DIR=src/components/ui bash scripts/ui-build-components.sh

Storybook 검사는 .storybook 디렉터리가 있으면 자동 실행. SKIP_STORYBOOK=1 로 건너뛴다.
  예: SKIP_STORYBOOK=1 bash scripts/ui-build-components.sh
예: bash scripts/ui-build-components.sh components/ui/button.tsx

한계: axe 는 ::placeholder 같은 가상요소 대비를 못 잡는다. 대비 회귀의 보조 게이트일 뿐
a11y 전반 보증이 아님 — 가상요소·동적 상태는 사람이 storybook 켜고 확인.
EOF
}

[ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ] && { usage; exit 0; }

ROOT="$(git rev-parse --show-toplevel)"
APP_DIR="${APP_DIR:-frontend}"   # 레포 루트 기준 상대경로. 시크릿 아님 — 단순 디렉터리 경로
APP_PATH="$ROOT/$APP_DIR"
[ -d "$APP_PATH" ] || { echo "✗ 앱 디렉터리 없음: $APP_PATH (APP_DIR 확인)" >&2; exit 1; }
cd "$APP_PATH"

UI_DIR="${UI_DIR:-components/ui}"            # 앱 디렉터리 기준 상대경로
STORIES_DIR="${STORIES_DIR:-components/stories}"
if [ "$#" -gt 0 ]; then
  FILES=("$@")
else
  FILES=("$UI_DIR" "$STORIES_DIR")
fi

fail=0
echo "▶ prettier --check"
pnpm exec prettier --check "${FILES[@]}" || fail=1

echo "▶ eslint (토큰 게이트)"
pnpm exec eslint --max-warnings 0 --no-warn-ignored "${FILES[@]}" || fail=1

if [ "${SKIP_STORYBOOK:-}" = "1" ]; then
  echo "▶ test-storybook — SKIP_STORYBOOK=1 로 건너뜀"
elif [ -d ".storybook" ]; then
  echo "▶ test-storybook (axe a11y)"
  pnpm test-storybook || fail=1
else
  echo "▶ test-storybook — .storybook 없음, 건너뜀 (axe a11y 미검증)"
fi

if [ "$fail" -ne 0 ]; then
  echo "✗ 게이트 실패 — 위 항목을 고치세요. (자동 commit 금지, 사람 보고)" >&2
  exit 1
fi
echo "✓ 게이트 통과 (prettier · eslint · test-storybook)"
