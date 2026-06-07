# 외부 자원

DESIGN.md / SKILL 생태계의 공개 자원 큐레이션. ui-agent 와 같이 쓸 수 있는 DESIGN.md 소스, SKILL 팩, 관련 도구를 한 곳에 정리.

## DESIGN.md 소스 — 기존 디자인 시스템 채택

| 자원                              | URL                                            | 한 줄                                                               |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| **Awesome-Design-Md** (VoltAgent) | https://github.com/VoltAgent/awesome-design-md | 55개 브랜드(Apple, Spotify, Notion 등) 디자인 시스템 DESIGN.md 모음 |
| **OMD (oh-my-design)**            | https://oh-my-design-lemon.vercel.app/         | 58개 기업(한국 대기업 포함) 디자인 시스템 커스텀 + DESIGN.md export |

### ui-agent 와의 관계

`design/DESIGN.md` 를 직접 작성하지 않고 위 자원에서 받아 채택 가능. ui-agent 는 DESIGN.md 형식에 제약을 두지 않고 [`@google/design.md`](https://github.com/google-labs-code/design.md) v0.2.0 의 DTCG export 가 처리할 수 있는 한 그대로 받아들임. 자세한 흐름은 [DESIGN-WORKFLOW.md](DESIGN-WORKFLOW.md) step 1 참고.

## SKILL 팩 — UI 작성 감각 / 변환 자동화

| 자원                              | URL                                               | 한 줄                                                      |
| --------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| **Google Stitch-Skills**          | https://github.com/google-labs-code/stitch-skills | Google 공식. DESIGN.md 생성부터 React 변환까지             |
| **Taste-Skill** (Leonxlnx)        | https://github.com/Leonxlnx/taste-skill           | AI 가 만드는 평범한 UI 의 디자인 감각 보정 SKILL (⭐ 5.5k) |
| **Supanova-Design-Skill**         | https://github.com/uxjoseph/supanova-design-skill | Taste-Skill 의 한국 랜딩페이지 변형, Pretendard 폰트 포함  |
| **OpenAI Figma-Implement-Design** | https://github.com/openai/skills                  | Figma URL 한 줄로 프로덕션 코드 변환하는 OpenAI 공식 SKILL |

### ui-agent 와의 관계

ui-agent 의 4 워크플로우 SKILL (#31, #32, #34, #36 — [umbrella #23](https://github.com/swayloop/ui-agent/issues/23)) 과 **층위가 다름**:

- 위 SKILL 들 = "감각" / "Figma→코드" 같은 **에이전트 행동 보정 / 변환 단일 동작**
- ui-agent SKILL = `DESIGN.md → tokens → 컴포넌트 → Figma → 코드 → 검증` **전체 워크플로우 orchestration**

함께 쓰는 흐름이 자연스러움 — ui-agent 가 단계 진행, 각 단계 안에서 Taste-Skill / Figma-Implement-Design 같은 단일 동작 SKILL 을 consumer 가 골라 끼움.

## 관련 글

- [피그마 코딩 에이전트에게 디자인 감각을 심어주는 MD 모음](https://figmapedia.com/entry/343fdea8-0034-803a-acdc-ef8b54c8c818) — 시원🌊 (피그팀), 2026-04-16. 위 자원들의 카탈로그 + 적용 패턴 한국어 소개

## 업데이트 정책

- 자원 추가/제거는 PR 로
- ui-agent 와 호환성 / 충돌 발견 시 본 문서에 비고 추가
- 외부 링크가 깨지거나 자원이 archive 되면 별도 표기 (사라진 자원도 history 로 남김)
