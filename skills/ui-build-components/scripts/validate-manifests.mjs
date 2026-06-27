#!/usr/bin/env node
// validate-manifests.mjs — 컴포넌트 manifest 가 요구 형식대로 작성됐는지 결정적 검증.
// 스키마 출처: ui-build-components/references/worker-flow.md "5. manifest 작성".
//   필수(문자열): name, path
//   필수(문자열 배열): variants, sizes, slots, tags
//   선택(문자열): replaces  — 단일 네이티브 태그 drop-in 대체일 때만
//
// replaces 검증 (path 의 .tsx 를 휴리스틱 스캔):
//   - replaces 있음 → 그 태그를 컴포넌트가 실제 렌더하는지 (오타·불일치 차단)
//   - replaces 없음 → 구조 태그 제외 네이티브 태그가 drop-in 태그 하나뿐이면 누락 판정
// 사용: node validate-manifests.mjs <*.manifest.json...>   (cwd = 앱 디렉터리)
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// 단일 태그 drop-in 프리미티브가 감쌀 만한 네이티브 태그 (이게 유일 네이티브면 replaces 필수)
const DROP_IN_TAGS = new Set([
  'button', 'input', 'textarea', 'select', 'a', 'label', 'img', 'progress', 'meter',
]);
// 합성/레이아웃에 흔히 섞이는 구조 태그 — replaces 필수 판정에서 제외 (오탐 방지)
const STRUCTURAL_TAGS = new Set([
  'div', 'span', 'p', 'section', 'article', 'header', 'footer', 'main', 'aside',
  'nav', 'ul', 'ol', 'li', 'figure', 'figcaption', 'br', 'hr', 'svg', 'path', 'g',
]);

// JSX 네이티브 태그(소문자 시작 = React 컴포넌트 PascalCase 와 구분) 추출
function extractNativeTags(src) {
  const tags = new Set();
  const re = /<([a-z][a-zA-Z0-9]*)\b/g;
  let m;
  while ((m = re.exec(src))) tags.add(m[1]);
  return tags;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('  (검증할 manifest 없음)');
  process.exit(0);
}

const REQUIRED_STRING = ['name', 'path'];
const REQUIRED_ARRAY = ['variants', 'sizes', 'slots', 'tags'];
const OPTIONAL_STRING = ['replaces'];
const KNOWN = new Set([...REQUIRED_STRING, ...REQUIRED_ARRAY, ...OPTIONAL_STRING]);

let failed = 0;
for (const file of files) {
  const errs = [];
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`✗ ${file}: JSON 파싱 실패 — ${e.message}`);
    failed++;
    continue;
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    console.error(`✗ ${file}: 최상위가 객체가 아님`);
    failed++;
    continue;
  }

  for (const k of REQUIRED_STRING) {
    if (!(k in data)) errs.push(`필수 필드 누락: ${k}`);
    else if (typeof data[k] !== 'string' || data[k].trim() === '')
      errs.push(`${k} 는 비어있지 않은 문자열이어야 함`);
  }
  for (const k of REQUIRED_ARRAY) {
    if (!(k in data)) errs.push(`필수 필드 누락: ${k}`);
    else if (!Array.isArray(data[k])) errs.push(`${k} 는 배열이어야 함`);
    else if (!data[k].every((v) => typeof v === 'string'))
      errs.push(`${k} 의 모든 항목은 문자열이어야 함`);
  }
  for (const k of OPTIONAL_STRING) {
    if (k in data && (typeof data[k] !== 'string' || data[k].trim() === ''))
      errs.push(`${k} 는 (있다면) 비어있지 않은 문자열이어야 함`);
  }
  for (const k of Object.keys(data)) {
    if (!KNOWN.has(k)) errs.push(`알 수 없는 필드: ${k}`);
  }
  const hasPath = typeof data.path === 'string' && data.path.trim() !== '';
  const pathAbs = hasPath ? resolve(data.path) : null;
  if (hasPath && !existsSync(pathAbs)) {
    errs.push(`path 가 가리키는 파일 없음: ${data.path}`);
  } else if (hasPath) {
    // replaces ↔ 컴포넌트 렌더 태그 정합성 (휴리스틱)
    let src = '';
    try {
      src = readFileSync(pathAbs, 'utf8');
    } catch {
      src = '';
    }
    const native = extractNativeTags(src);
    const replaces = typeof data.replaces === 'string' ? data.replaces.trim() : '';
    if (replaces) {
      if (!native.has(replaces))
        errs.push(`replaces="${replaces}" 인데 컴포넌트가 <${replaces}> 를 렌더하지 않음 (오타·불일치?)`);
    } else {
      const nonStructural = [...native].filter((t) => !STRUCTURAL_TAGS.has(t));
      if (nonStructural.length === 1 && DROP_IN_TAGS.has(nonStructural[0]))
        errs.push(`단일 네이티브 태그 <${nonStructural[0]}> 를 감싸는데 replaces 누락 — replaces:"${nonStructural[0]}" 필요`);
    }
  }

  if (errs.length) {
    console.error(`✗ ${file}`);
    for (const e of errs) console.error(`    - ${e}`);
    failed++;
  }
}

if (failed) {
  console.error(`✗ manifest ${failed}건 형식 위반 — worker-flow.md 5절 참고`);
  process.exit(1);
}
console.log(`✓ manifest ${files.length}건 형식 통과`);
