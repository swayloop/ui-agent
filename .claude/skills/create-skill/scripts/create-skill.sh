#!/usr/bin/env bash
# create-skill.sh — 5원칙 + Claude/Codex 호환 스킬을 위한 결정적 도구.
#   scaffold   새 스킬 뼈대 생성
#   verify     스킬을 작성 원칙/호환 기준으로 결정적 린트 (작업 후 검증)
#   install    ~/.claude/skills 와 ~/.codex/skills 에 심링크 (양쪽 호환)
set -euo pipefail

err() { printf 'create-skill: %s\n' "$*" >&2; exit 1; }

KEBAB_RE='^[a-z0-9]+(-[a-z0-9]+)*$'
LEAN_MAX=120   # SKILL.md 본문 권장 최대 줄 수 (원칙 3·6)
DESC_MIN=30    # description 최소 길이(자) — 라우팅 구체성 휴리스틱 (원칙 1)

usage() {
  cat <<'EOF'
create-skill.sh <command> [options]

Commands:
  scaffold --name <name> --description "<desc>" [--dest DIR] [--with-script]
      새 스킬 뼈대 생성. DIR/<name>/ 에 SKILL.md, references/example.md,
      agents/openai.yaml (그리고 --with-script 면 scripts/<name>.sh) 생성.
      --dest 기본값: 현재 디렉토리.

  verify <skill-dir>
      작성 원칙/호환 기준 린트. frontmatter·name·description·lean·예시·Codex호환 확인.
      하드 실패(✗) 있으면 비정상 종료.

  install <skill-dir> [--force]
      ~/.claude/skills/ 와 ~/.codex/skills/ 에 심링크. --force 면 기존 링크 덮어씀.

  -h, --help
EOF
}

# ───────────────────────── scaffold ─────────────────────────
cmd_scaffold() {
  local name="" desc="" dest="." with_script=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --name) name="${2:-}"; shift 2 ;;
      --description) desc="${2:-}"; shift 2 ;;
      --dest) dest="${2:-}"; shift 2 ;;
      --with-script) with_script=1; shift ;;
      *) err "scaffold: 알 수 없는 옵션 $1" ;;
    esac
  done
  [ -n "$name" ] || err "--name 필수"
  [ -n "$desc" ] || err "--description 필수 (라우팅 규칙처럼 구체적으로)"
  [[ "$name" =~ $KEBAB_RE ]] || err "이름은 kebab-case 여야 함: $name"
  local root="$dest/$name"
  [ -e "$root" ] && err "이미 존재함: $root"

  mkdir -p "$root/references" "$root/agents"
  [ "$with_script" -eq 1 ] && mkdir -p "$root/scripts"

  cat > "$root/SKILL.md" <<EOF
---
name: $name
description: $desc
allowed-tools: Bash, Read, Write
---

# $name

<!-- TODO: 이 스킬이 하는 '한 가지' 작업을 한 문장으로. (원칙 4) -->

## 어떻게 (필요한 문서로 이동)

<!-- TODO: 본문은 라우터다. 디테일은 references/ 와 스크립트 --help 로 보내고
     여기엔 '무엇을 / 어디서 보라'만. (원칙 3·6) -->
- 구체 예시 → references/example.md
EOF

  cat > "$root/references/example.md" <<EOF
# 예시

<!-- TODO: 추상 규칙이 아니라 실제로 동작한 구체 예시 하나. (원칙 5) -->
EOF

  local short="${desc:0:70}"
  cat > "$root/agents/openai.yaml" <<EOF
interface:
  display_name: "$name"
  short_description: "$short"
  default_prompt: "\$$name 를 시작해줘."

policy:
  allow_implicit_invocation: true
EOF

  if [ "$with_script" -eq 1 ]; then
    cat > "$root/scripts/$name.sh" <<EOF
#!/usr/bin/env bash
# $name.sh — 결정적 작업(파싱·검증·정렬)을 여기서. (원칙 2)
set -euo pipefail

# TODO: 구현. 작업을 마친 뒤 결과를 다시 읽어 검증하는 단계를 포함하라.
echo "TODO: implement $name"
EOF
    chmod +x "$root/scripts/$name.sh"
  fi

  printf '생성됨: %s\n' "$root"
  find "$root" -type f | sed 's/^/  /'
  printf '\n다음: 1) TODO 채우기  2) verify %s  3) install %s\n' "$root" "$root"
}

# ───────────────────────── verify ─────────────────────────
cmd_verify() {
  local dir="${1:-}"
  [ -n "$dir" ] || err "verify <skill-dir>"
  [ -d "$dir" ] || err "디렉토리 없음: $dir"
  local skill="$dir/SKILL.md"
  local base; base=$(basename "$(cd "$dir" && pwd)")
  local fails=0 warns=0
  ok()   { printf '  \xe2\x9c\x93 %s\n' "$1"; }
  fail() { printf '  \xe2\x9c\x97 %s\n' "$1"; fails=$((fails+1)); }
  warn() { printf '  \xe2\x9a\xa0 %s\n' "$1"; warns=$((warns+1)); }

  printf '검증: %s\n' "$dir"

  if [ ! -f "$skill" ]; then
    fail "SKILL.md 없음"
    printf '\n결과: ✗ %d, ⚠ %d\n' "$fails" "$warns"
    exit 1
  fi

  # frontmatter
  if [ "$(head -1 "$skill")" = "---" ]; then ok "frontmatter 시작(---)"; else fail "frontmatter 없음 (첫 줄이 --- 이어야)"; fi
  local fm; fm=$(awk 'NR==1{next} /^---[[:space:]]*$/{exit} {print}' "$skill")

  # name
  local name_val; name_val=$(printf '%s\n' "$fm" | sed -n 's/^name:[[:space:]]*//p' | head -1)
  if [ -n "$name_val" ]; then
    ok "name: $name_val"
    [ "$name_val" = "$base" ] && ok "name == 디렉토리명" || fail "name($name_val) ≠ 디렉토리($base)"
  else
    fail "frontmatter 에 name 없음"
  fi

  # description (원칙 1)
  local desc_val; desc_val=$(printf '%s\n' "$fm" | sed -n 's/^description:[[:space:]]*//p' | head -1)
  if [ -n "$desc_val" ]; then
    ok "description 존재"
    local dlen=${#desc_val}
    [ "$dlen" -ge "$DESC_MIN" ] && ok "①설명 구체성(길이 $dlen)" || warn "①설명이 짧음(${dlen}자) — 언제 활성화되는지 더 구체적으로"
  else
    fail "frontmatter 에 description 없음"
  fi

  # lean (원칙 3)
  local second; second=$(grep -n '^---[[:space:]]*$' "$skill" | sed -n '2p' | cut -d: -f1)
  if [ -n "$second" ]; then
    local total; total=$(wc -l < "$skill")
    local body=$((total - second))
    [ "$body" -le "$LEAN_MAX" ] && ok "③ lean(본문 ${body}줄)" || warn "③ SKILL.md 본문이 김(${body}줄) — 세부는 references/ 로 라우팅"
  fi

  # 구체 예시 (원칙 5)
  if ls "$dir"/references/* >/dev/null 2>&1 || grep -q 'references/' "$skill"; then
    ok "⑤ 보조파일/예시 참조 있음"
  else
    warn "⑤ 구체 예시 없음 — references/example.md 권장"
  fi

  # Codex 호환
  [ -f "$dir/agents/openai.yaml" ] && ok "Codex 호환(agents/openai.yaml)" || warn "Codex 호환 파일 없음 — agents/openai.yaml 권장"

  # 결정적 코드 (원칙 2, 조언)
  [ -d "$dir/scripts" ] && ok "② scripts/ 존재" || warn "② 결정적 작업이 있으면 scripts/ 로 (자동 린트 불가, 수동 확인)"

  # 잔여 TODO
  grep -q 'TODO' "$skill" && warn "SKILL.md 에 TODO 남음 — 채우세요" || true

  printf '\n결과: ✗ %d, ⚠ %d\n' "$fails" "$warns"
  [ "$fails" -eq 0 ] || exit 1
}

# ───────────────────────── install ─────────────────────────
cmd_install() {
  local dir="${1:-}"; shift || true
  [ -n "$dir" ] || err "install <skill-dir>"
  [ -d "$dir" ] || err "디렉토리 없음: $dir"
  local force=0
  [ "${1:-}" = "--force" ] && force=1

  local abs; abs=$(cd "$dir" && pwd)
  local name; name=$(basename "$abs")
  [ -f "$abs/SKILL.md" ] || err "SKILL.md 없음 — 스킬 폴더가 맞나요?"

  local t link
  for t in "$HOME/.claude/skills" "$HOME/.codex/skills"; do
    mkdir -p "$t"
    link="$t/$name"
    if [ -e "$link" ] || [ -L "$link" ]; then
      if [ "$force" -eq 1 ]; then rm -f "$link"; else
        printf '건너뜀(이미 존재, --force 로 덮어쓰기): %s\n' "$link"; continue
      fi
    fi
    ln -s "$abs" "$link"
    printf '설치: %s -> %s\n' "$link" "$abs"
  done
  printf '\n호출: Claude=/%s,  Codex=$%s\n' "$name" "$name"
}

# ───────────────────────── dispatch ─────────────────────────
main() {
  local sub="${1:-}"; shift || true
  case "$sub" in
    scaffold) cmd_scaffold "$@" ;;
    verify)   cmd_verify "$@" ;;
    install)  cmd_install "$@" ;;
    -h|--help|"") usage ;;
    *) err "알 수 없는 명령: $sub (scaffold|verify|install)" ;;
  esac
}
main "$@"
