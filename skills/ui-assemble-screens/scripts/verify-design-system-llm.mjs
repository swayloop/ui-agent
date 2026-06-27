#!/usr/bin/env node
// verify-design-system-llm.mjs — 조립된 화면이 DS/IA 를 의미적으로 잘 사용했는지 LLM 으로 검증한다.
//
// ui-assemble-screens.sh 가 LLM_VERIFY=1 일 때만 호출한다. raw-tag lint 가 잡지 못하는
// "IA 의도에 맞는 DS 컴포넌트를 골랐는지", "DS 컴포넌트를 우회해 임의 UI를 만들었는지"를 본다.
//
// 어댑터 (model-agnostic): LLM_CLI=claude(기본) | codex
// CLI 미설치 / 호출 실패 / 판정 파싱 실패 → 게이트를 깨지 않고 skip(경고). opt-in 보조 게이트라
// 인프라 문제로 빌드를 막지 않는다.
//
// 사용: LLM_VERIFY=1 LLM_CLI=codex node verify-design-system-llm.mjs <page-file...> (cwd = 앱 디렉터리)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const pages = expandInputs(process.argv.slice(2));
if (pages.length === 0) {
  console.log('  (검증할 page 없음)');
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

const UI_DIR = process.env.UI_DIR || 'components/ui';
const IA_DIR = process.env.IA_DIR || 'ia/screens';
const DESIGN_PATH = process.env.DESIGN_PATH || 'design/DESIGN.md';

const RULES = [
  '너는 React 화면 조립 결과가 디자인시스템을 의미적으로 잘 사용했는지 검증하는 린터다.',
  '- IA frontmatter/components 또는 화면 구성에 지정된 DS 컴포넌트가 있으면 그 컴포넌트를 우선 사용해야 한다.',
  '- 대응 DS 컴포넌트/패턴이 있는데 div/span/직접 스타일 조합으로 새 UI를 만들면 ok=false.',
  '- DS manifest 의 variants/sizes/slots/tags 를 참고해, 용도와 맞지 않는 컴포넌트 선택이나 variant 오용이 뚜렷하면 ok=false.',
  '- IA 에 없는 구조나 기능을 코드가 임의로 추가한 흔적이 뚜렷하면 ok=false.',
  '- 단순 layout wrapper, semantic section/header/main, 아이콘 버튼처럼 manifest 로 대체 불가능한 gap 은 ok=true 로 두고 reason 에 gap 으로 언급한다.',
  '- 파일을 수정하지 말고 판정만 하라.',
  '마지막 줄에 아래 형식의 JSON 한 줄만 출력하라:',
  'VERDICT {"ok": true, "reason": "한국어 사유 한 줄"}',
].join('\n');

const design = readOptional(DESIGN_PATH);
const manifests = readManifests(UI_DIR);

let failed = 0;
let skipped = 0;
let checked = 0;
for (const page of pages) {
  const pageSrc = readOptional(page);
  if (!pageSrc) {
    console.log(`  ⚠ ${page} 읽기 실패 — skip`);
    skipped++;
    continue;
  }

  const iaPath = findIaPath(page);
  const ia = iaPath ? readOptional(iaPath) : '';
  const prompt = `${RULES}

## DESIGN.md: ${DESIGN_PATH}
\`\`\`md
${clip(design || '(없음)', 12000)}
\`\`\`

## DS manifest (${UI_DIR})
\`\`\`json
${clip(JSON.stringify(manifests, null, 2), 16000)}
\`\`\`

## IA: ${iaPath || '(매칭 없음)'}
\`\`\`md
${clip(ia || '(없음)', 12000)}
\`\`\`

## page: ${page}
\`\`\`tsx
${clip(pageSrc, 24000)}
\`\`\``;

  const res = spawnSync(adapter.bin, adapter.args(prompt), {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (res.error || res.status !== 0) {
    const why = String(res.stderr || res.error?.message || '')
      .slice(0, 80)
      .replace(/\n/g, ' ');
    console.log(`  ⚠ ${page}: ${adapter.bin} 호출 실패 — skip (${why})`);
    skipped++;
    continue;
  }

  const verdict = parseVerdict(res.stdout);
  if (!verdict) {
    console.log(`  ⚠ ${page}: 판정 파싱 실패 — skip`);
    skipped++;
    continue;
  }
  checked++;
  if (verdict.ok) {
    console.log(`  ✓ ${page}: ${verdict.reason || 'DS 사용 적합'}`);
  } else {
    console.error(`  ✗ ${page}: ${verdict.reason || 'DS 사용 부적합'}`);
    failed++;
  }
}

function readOptional(path) {
  try {
    return readFileSync(resolve(path), 'utf8');
  } catch {
    return '';
  }
}

function readManifests(uiDir) {
  const dir = resolve(uiDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.manifest.json'))
    .map((file) => {
      const path = join(dir, file);
      try {
        return JSON.parse(readFileSync(path, 'utf8'));
      } catch {
        return { file, error: 'manifest parse failed' };
      }
    });
}

function expandInputs(inputs) {
  const files = [];
  for (const input of inputs) {
    const path = resolve(input);
    let stat;
    try {
      stat = statSync(path);
    } catch {
      files.push(input);
      continue;
    }
    if (!stat.isDirectory()) {
      files.push(input);
      continue;
    }
    collectPageFiles(path, files);
  }
  return files;
}

function collectPageFiles(dir, files) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectPageFiles(path, files);
      continue;
    }
    if (/\.(tsx|jsx)$/.test(entry.name)) {
      files.push(path);
    }
  }
}

function findIaPath(page) {
  const stem = basename(page).replace(/\.[^.]+$/, '');
  const candidates = [`${stem}.md`, `${toKebab(stem)}.md`, `${stem.toLowerCase()}.md`].map((name) =>
    join(IA_DIR, name),
  );
  return candidates.find((candidate) => existsSync(resolve(candidate))) || null;
}

function toKebab(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function clip(value, max) {
  const text = String(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n... clipped ${text.length - max} chars ...`;
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
  console.error(`✗ DS 의미 검증 ${failed}건 위반 (검사 ${checked}, skip ${skipped})`);
  process.exit(1);
}
console.log(`✓ DS 의미 검증 통과 (검사 ${checked}, skip ${skipped})`);
