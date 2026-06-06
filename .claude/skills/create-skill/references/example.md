# Worked Example — `pr-summary` 스킬 만들기

추상 설명 대신, 실제로 한 번 돌려본 흐름.

## 1. 뼈대 생성

```bash
bash scripts/create-skill.sh scaffold \
  --name pr-summary \
  --description "현재 브랜치의 변경으로 PR 설명을 작성할 때 사용한다. git diff 를 요약해 제목·본문을 만든다." \
  --dest ./skills \
  --with-script
```

생성 결과:
```
skills/pr-summary/
  SKILL.md            # frontmatter 채워짐, 본문은 TODO 라우터
  references/example.md   # TODO
  scripts/pr-summary.sh   # TODO 스텁
  agents/openai.yaml      # display_name·default_prompt 채워짐
```

## 2. 내용 채우기

- `SKILL.md` 본문: "어떻게" 섹션에서 `scripts/pr-summary.sh` 와 `references/example.md` 로 라우팅만.
- `scripts/pr-summary.sh`: `git diff` 파싱·요약 같은 **결정적 작업**, 그리고 생성한 PR 본문이 형식을 지켰는지 사후 검증.
- `references/example.md`: 실제 diff → 실제 PR 본문 예시 한 쌍.

## 3. 검증

```bash
bash scripts/create-skill.sh verify ./skills/pr-summary
```
```
검증: ./skills/pr-summary
  ✓ frontmatter 시작(---)
  ✓ name: pr-summary
  ✓ name == 디렉토리명
  ✓ description 존재
  ✓ ①설명 구체성(길이 58)
  ✓ ③lean(본문 12줄)
  ✓ ⑤보조파일/예시 참조 있음
  ✓ Codex 호환(agents/openai.yaml)
  ✓ ②결정적 스크립트 존재
  ⚠ SKILL.md 에 TODO 남음 — 채우세요

결과: ✗ 0, ⚠ 1
```
→ TODO 채우면 ⚠ 0.

## 4. 설치 (양쪽)

```bash
bash scripts/create-skill.sh install ./skills/pr-summary
```
```
설치: /Users/me/.claude/skills/pr-summary -> /abs/skills/pr-summary
설치: /Users/me/.codex/skills/pr-summary  -> /abs/skills/pr-summary

호출: Claude=/pr-summary,  Codex=$pr-summary
```
