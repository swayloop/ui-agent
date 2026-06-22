# 예시 — `experiment-list` 조립

## 1. IA 읽기

`ia/screens/experiment-list.md`:

- `components:` AppHeader · Card · Badge · Button · Input · Dialog · Label · Textarea
- 구성: 타이틀 / 도구 행(`+ 새 실험`·검색) / 실험 리스트(행 단위)
- Do: 검색 필터 · 새 실험 생성(모달) | Go: 행 클릭 → `[experiment-detail]`

## 2. 조립

## 3. 검증

```bash
bash scripts/ui-assemble-screens.sh src/pages/ExperimentList.tsx
```

## 4. 피드백 기록

받은 피드백·조치를 `references/feedback-log.md` 에 한 줄 누적.
예 "카드 말고 리스트" → 레이어=IA → `ia/screens/experiment-list.md` 수정.
