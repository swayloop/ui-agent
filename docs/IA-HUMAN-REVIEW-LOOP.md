# IA Human Review Loop

## 핵심 플로우

```text
IA 작성
→ 페이지 워커 구현
→ formatter / typecheck / lint / build
→ dev 서버 실행 + 검토 URL 제공
→ 사람이 실제 웹에서 검토
→ 에이전트가 피드백 분류
→ IA/코드 수정
→ 재검증
→ 사람 재검토
→ 승인 시 종료
```

## 피드백 분류

| 분류        | 조치                                 |
| ----------- | ------------------------------------ |
| `spec-gap`  | IA를 먼저 수정하고 코드를 수정       |
| `code-bug`  | IA는 유지하고 코드만 수정            |
| `token-gap` | 사람 결정 후 DESIGN.md와 코드를 수정 |

## 수정 규칙

- `spec-gap`: 사람 피드백 → screen/flow IA 갱신 → 변경된 IA 기준으로 재구현
- `code-bug`: 명시된 IA 기준으로 구현만 교정
- `token-gap`: 에이전트가 임의 토큰을 만들지 않고 사람에게 결정 요청
- 페이지 워커는 자기 소유 파일만 수정
- 자동 commit/push 금지

## 종료 조건

- 사람이 웹에서 승인
- IA와 구현 일치
- DESIGN.md 준수
- formatter/typecheck/lint/build 통과
- 확정된 `spec-gap`이 IA 본문에 반영됨

초기 구현은 LangGraph 없이 skill 또는 CLI로 운영한다.
