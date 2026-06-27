// eslint-raw-tag-gate.mjs — ui-assemble-screens
//
// 컴포넌트 manifest 의 `replaces` 에서 "막을 raw 태그" 를 유도한다.
// 프리미티브가 있는 네이티브 태그만 막아 false-positive 방지 — 프리미티브 추가 시
// manifest 에 `replaces` 만 넣으면 게이트가 자동 확장된다.
//
// 사용 (eslint.config.js):
//   import { restrictedRawTags } from './.agents/skills/ui-assemble-screens/scripts/eslint-raw-tag-gate.mjs'
//   export default [
//     {
//       files: ['src/pages/**'],
//       rules: { 'no-restricted-syntax': ['error', ...restrictedRawTags('src/components/ui')] },
//     },
//   ]
//
// 대응 프리미티브가 없어 정당하게 raw 를 써야 하는 곳(아이콘 버튼 / 클릭 카드 /
// file input 등)은:
//   // eslint-disable-next-line no-restricted-syntax -- 사유(gap)
// 로 예외 처리한다. 그 disable 사유 목록이 곧 "채워야 할 프리미티브" 백로그.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @param {string} uiDir 프리미티브 manifest 디렉토리 (eslint 실행 cwd 기준 상대경로)
 * @returns no-restricted-syntax 셀렉터 배열
 */
export function restrictedRawTags(uiDir) {
  return readdirSync(uiDir)
    .filter((f) => f.endsWith('.manifest.json'))
    .map((f) => JSON.parse(readFileSync(join(uiDir, f), 'utf8')))
    .filter((m) => m.replaces)
    .map((m) => ({
      selector: `JSXOpeningElement[name.name='${m.replaces}']`,
      message: `raw <${m.replaces}> 금지 — DS <${m.name}> 사용. 대응 프리미티브 없는 정당한 경우만 eslint-disable + 사유(gap) 명시.`,
    }));
}
