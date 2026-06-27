#!/usr/bin/env node
// verify-replaces-llm.mjs — manifest 의 replaces 를 코딩 에이전트 CLI(헤드리스)로 의미 검증 (opt-in).
//
// ui-build-components.sh 가 LLM_VERIFY=1 일 때만 호출한다. replaces 의 "채울지 / 값이 맞는지" 는
// 의미 판단이라 형식 게이트(validate-manifests.mjs)가 안 잡는 부분을 여기서 본다.
//
// 어댑터 (model-agnostic): LLM_CLI=claude(기본) | codex
// CLI 미설치 / 호출 실패 / 판정 파싱 실패 → 게이트를 깨지 않고 skip(경고). opt-in 보조 게이트라
// 인프라 문제로 빌드를 막지 않는다.
//
// 판정 규칙 출처: ui-build-components/references/worker-flow.md 5절.
// 사용: LLM_CLI=claude node verify-replaces-llm.mjs <*.manifest.json...>   (cwd = 앱 디렉터리)
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('  (검증할 manifest 없음)');
  process.exit(0);
}

const CLI = process.env.LLM_CLI || 'claude';
const ADAPTERS = {
  claude: { bin: 'claude', args: (p) => ['-p', p] },
  codex: { bin: 'codex', args: (p) => ['exec', '--color', 'never', p] },
};
const adapter = ADAPTERS[CLI];
if (!adapter) {
  console.log(`  ⚠ 알 수 없는 LLM_CLI=${CLI} (claude|codex) — LLM 검증 skip`);
  process.exit(0);
}
if (spawnSync(adapter.bin, ['--version'], { encoding: 'utf8' }).error) {
  console.log(`  ⚠ ${adapter.bin} CLI 없음 — LLM 검증 skip (게이트 통과)`);
  process.exit(0);
}

const RULES = [
  '너는 React 디자인시스템 컴포넌트 manifest 의 "replaces" 필드를 검증하는 린터다.',
  '- 컴포넌트가 단일 네이티브 HTML 태그를 drop-in 대체하면(예: <button> 하나만 감쌈) replaces 에 그 태그명을 채워야 한다.',
  '- replaces 값은 컴포넌트가 실제 렌더하는 태그와 정확히 일치해야 한다.',
  '- Radix 합성 등 단일 태그 대체가 아니면 replaces 는 없어야 한다(비운다).',
  '파일을 수정하지 말고 판정만 하라. replaces 가 규칙에 맞으면 ok=true, 아니면 ok=false.',
  '마지막 줄에 아래 형식의 JSON 한 줄만 출력하라:',
  'VERDICT {"ok": true, "reason": "한국어 사유 한 줄"}',
].join('\n');

let failed = 0;
let skipped = 0;
let checked = 0;
for (const file of files) {
  let manifestRaw;
  try {
    manifestRaw = readFileSync(file, 'utf8');
  } catch {
    console.log(`  ⚠ ${file} 읽기 실패 — skip`);
    skipped++;
    continue;
  }
  let srcPath = null;
  try {
    srcPath = JSON.parse(manifestRaw).path;
  } catch {
    /* 형식 게이트가 잡음 */
  }
  let src = '(소스 없음)';
  if (srcPath && existsSync(resolve(srcPath))) {
    try {
      src = readFileSync(resolve(srcPath), 'utf8');
    } catch {
      /* 소스 없이 진행 */
    }
  }

  const prompt = `${RULES}

## manifest: ${file}
\`\`\`json
${manifestRaw}
\`\`\`

## 컴포넌트 소스: ${srcPath ?? '?'}
\`\`\`tsx
${src}
\`\`\``;

  const res = spawnSync(adapter.bin, adapter.args(prompt), {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (res.error || res.status !== 0) {
    const why = String(res.stderr || res.error?.message || '')
      .slice(0, 80)
      .replace(/\n/g, ' ');
    console.log(`  ⚠ ${file}: ${adapter.bin} 호출 실패 — skip (${why})`);
    skipped++;
    continue;
  }

  const verdict = parseVerdict(res.stdout);
  if (!verdict) {
    console.log(`  ⚠ ${file}: 판정 파싱 실패 — skip`);
    skipped++;
    continue;
  }
  checked++;
  if (verdict.ok) {
    console.log(`  ✓ ${file}`);
  } else {
    console.error(`  ✗ ${file}: ${verdict.reason || 'replaces 규칙 위반'}`);
    failed++;
  }
}

// CLI 로그가 섞여도 "ok" 키를 가진 마지막 JSON 객체를 뽑는다 (중첩 없는 1뎁스 객체)
function parseVerdict(out) {
  const matches = String(out).match(/\{[^{}]*"ok"[^{}]*\}/g);
  if (!matches) return null;
  try {
    return JSON.parse(matches[matches.length - 1]);
  } catch {
    return null;
  }
}

if (failed) {
  console.error(`✗ replaces 의미 검증 ${failed}건 위반 (검사 ${checked}, skip ${skipped})`);
  process.exit(1);
}
console.log(`✓ replaces 의미 검증 통과 (검사 ${checked}, skip ${skipped})`);
