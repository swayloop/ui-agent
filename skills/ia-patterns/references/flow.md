# 도출 절차

`ia/screens/*.md` · `ia/flows/*.md` 의 frontmatter `components:` 만 입력으로 쓴다.
순서: 스캔 → DS 차감 → 플로우 접기 → 빈도 승격 → 분류 → 빌드.

**1~4 단계(스캔·차감·접기·승격)는 결정적이라 스크립트가 한 번에 처리한다:**

```
python3 scripts/scan-components.py --ia <IA_DIR> --ui <components/ui_DIR> [--threshold 2]
```

→ 컴포넌트별 화면수 · DS 여부 · 거취(원자 차감 / 공통 승격 / 페이지 로컬) 표 + 승격 목록.
아래는 그 스크립트가 수행하는 각 단계의 근거(직접 손으로 돌릴 때 참고).

## 1. 스캔

전 IA 파일의 frontmatter `components:` 리스트를 수집. 인라인 주석(`# ...`)은 제거하고
컴포넌트명만 추출(주석 줄에서 끊기지 않게 주의).

## 2. DS 차감 (빈도 전에)

`components/ui/*.manifest.json` 에 이미 있는 원자(Button·Card·Badge·Input·Dialog 등)는
**빈도와 무관하게 제외**. 새 패턴이 아니라 이미 프리미티브다. 빈도 스캔은 _비-DS 컴포지트_
에만 의미가 있다. IA 가 DS 에 없는 이름(예 `Modal`)을 썼으면 대응 DS(`Dialog`)로 환산.

## 3. 플로우 접기

`kind: flow` 파일은 host 화면(`in_screen`)으로 접어서 센다. 플로우가 화면의 컴포넌트를
재나열하므로, 접지 않으면 같은 화면이 중복 집계돼 빈도가 부풀려진다.

## 4. 빈도 승격

차감 후 남은 비-DS 중:

- **여러 화면 등장(≥2) → 공통 승격**
- **1 화면 → 페이지 로컬** (성급한 추상화 방지 — co-occurrence 라도 한 화면 안이면 안 올림)

## 5. 분류

승격분을 2종으로:

- **레이아웃 셸**: 페이지를 감싸는 구조(slot/children) — 헤더·사이드바·본문 컨테이너.
  헤더 등 기존 컴포넌트는 **슬롯으로 주입**(합쳐넣지 않음) → 화면별 props 유지.
- **반복 콘텐츠 패턴**: 화면 내 반복 덩어리 — 칩 row, 메시지 버블, 카드 그리드 등.

## 6. 산출

- **인벤토리**: `ia/patterns/README.md`(도출 규칙 + 스캔 표) + `ia/patterns/<id>.md`
  (IA 와 동일 frontmatter, `appears_in:` 이 스캔으로 자동 채워져 "왜 공통인지" 증명).
- **빌드**(승격분만): `components/ui/<id>.tsx` + manifest + 스토리. DESIGN.md 토큰만 사용,
  IA 에 없는 변형(tone 등)은 넣지 않는다.

## 검증

`prettier --check` · eslint(토큰 + raw-tag 게이트) · `tsc` · `build-storybook` 통과 확인.
