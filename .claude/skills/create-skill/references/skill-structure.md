# 스킬 폴더 구조 & 호환

Claude Code 와 Codex 는 **같은 오픈 표준 `SKILL.md`** 를 쓴다. 한 폴더로 양쪽에서 동작한다.

## 폴더 구조

```
<name>/
  SKILL.md            # 필수. frontmatter(name·description) + 라우터 본문
  references/         # 세부 문서 (필요 시 로드)
    example.md
  scripts/            # 결정적 작업 (선택, --with-script)
  agents/openai.yaml  # Codex 전용 인터페이스 (Claude 는 무시)
```

## frontmatter — 공통 vs 에이전트 전용

| 키 | 어디서 | 비고 |
|---|---|---|
| `name` | 공통 (필수) | 디렉토리명과 동일해야 함 |
| `description` | 공통 (필수) | 라우팅 규칙처럼 구체적으로 |
| `allowed-tools` | Claude 전용 | Codex 는 무시 (있어도 무해) |
| `disable-model-invocation` | Claude 전용 | 수동 호출만 강제할 때 |
| `agents/openai.yaml` | Codex 전용 | interface·policy. Claude 는 무시 |

**핵심:** 한쪽 전용 설정을 같은 폴더에 둬도 상대 에이전트가 그냥 무시하므로 충돌 없음.

## 호출 방법

- Claude Code: `/<name>` 또는 description 매칭 시 자동
- Codex: `$<name>` 또는 `/skills`, 또는 description 매칭 시 자동

## 설치 위치

| | Claude Code | Codex |
|---|---|---|
| 개인(전역) | `~/.claude/skills/<name>/` | `~/.codex/skills/<name>/` |
| 프로젝트 | `.claude/skills/<name>/` | `.codex/skills/<name>/` |

`create-skill.sh install` 은 정본 폴더를 두 개인 디렉토리에 **심링크**해 단일 정본을 유지한다.
