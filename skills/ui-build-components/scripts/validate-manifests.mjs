#!/usr/bin/env node
// validate-manifests.mjs — 컴포넌트 manifest 가 요구 형식대로 작성됐는지 결정적 검증.
// 스키마 출처: ui-build-components/references/worker-flow.md "5. manifest 작성".
//   필수(문자열): name, path
//   필수(문자열 배열): variants, sizes, slots, tags
//   선택(문자열): replaces  — 단일 네이티브 태그 drop-in 대체일 때만
//
// replaces 의 "채울지 / 값이 맞는지" 는 의미 판단이라 여기서 검증하지 않는다 —
// 컴포넌트를 쓴 워커 LLM 의 자기검증 책임 (worker-flow.md 5절). 여기선 형식만.
// 사용: node validate-manifests.mjs <*.manifest.json...>   (cwd = 앱 디렉터리)
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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
  if (typeof data.path === 'string' && data.path.trim() !== '' && !existsSync(resolve(data.path))) {
    errs.push(`path 가 가리키는 파일 없음: ${data.path}`);
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
