# 도출 절차

입력: `ia/screens/**` (`<screen>.md` / `<screen>/<screen>.md` / `<screen>/flows/<flow>.md`) 의
frontmatter `components:`. `ia/legacy/**` 는 제외.

## 스캔 (1~4단계, 스크립트가 처리)

```
python3 scripts/scan-components.py --ia <IA_DIR> --ui <components/ui_DIR> [--threshold 2]
```

1. **스캔** — 전 IA 의 `components:` 수집 (인라인 `#` 주석 제거).
2. **DS 차감** — `components/ui/*.manifest.json` 에 있는 원자 또는 shadcn 이 프리미티브로 제공하는 원자는 제외.
3. **플로우 접기** — `kind: flow` 는 host(`in_screen`)로 접어 중복 집계 방지.
4. **빈도** — 비-DS 중 ≥2 화면 = 공통 승격, 1 화면 = 페이지 로컬.

## 5. 분류 (사람) — 거취 3종

- **공통 컴포넌트 (→ `ui-build-components` 핸드오프)** — 판정 기준은 등장 횟수가 아니라 **shadcn 이 프리미티브로 제공하는가**(Table·Chart·Progress·Accordion 등).
- **레이아웃 셸** — ≥2 화면 공통, 페이지 감싸는 구조. 기존 컴포넌트는 합치지 말고 슬롯 주입.
- **반복 콘텐츠 패턴** — ≥2 화면의 도메인 반복 덩어리(칩 row·버블·결과 카드).
- _(shadcn 에도 없고 한 화면뿐인 도메인 조합 = 페이지 로컬, 위 프리미티브로 조립.)_

> shadcn 프리미티브면 컴포넌트(→ `ui-build-components`), 화면 가로지르는 구조·반복이면 셸·패턴(→ `ia/patterns/`).

## 6. 산출

- **공통 컴포넌트** → `ui-build-components` 에 할당 (빌드·DESIGN.md 등재는 그 스킬이 처리).
- **셸·패턴** → `ia/patterns/<id>.md` 인벤토리(`appears_in:` 자동) + `components/ui/<id>.tsx` + manifest + 스토리.
- 빌드물은 DESIGN.md 토큰만 사용, IA 에 없는 변형(tone 등) 금지.

## 검증

빌드분은 `ui-build-components` 와 동일 게이트: `prettier --check` · eslint(토큰+raw-tag) · `tsc` ·
`build-storybook` · `test-storybook`(axe a11y). Storybook 미설치면 안내 후 skip + 보고에 명시.
