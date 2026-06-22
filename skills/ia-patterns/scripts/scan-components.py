#!/usr/bin/env python3
"""IA frontmatter components: 스캔 → 빈도 도출 (step 2).

절차(flow.md)를 결정적으로 수행:
  1. scan      ia/screens·flows 의 frontmatter components: 수집 (인라인 주석 제거)
  2. DS 차감   components/ui/*.manifest.json 의 원자는 빈도와 무관하게 제외 표시
  3. 플로우 접기  kind: flow 는 in_screen(host)으로 접어 화면 중복 집계 방지
  4. 빈도 승격  비-DS 중 ≥threshold 화면 = 공통 승격, 1 = 페이지 로컬

사용:
  python3 scan-components.py --ia <IA_DIR> --ui <UI_MANIFEST_DIR> [--threshold 2]
"""

from __future__ import annotations

import argparse
import glob
import os
import re
from collections import defaultdict

# IA 'Modal' 처럼 DS 에 다른 이름으로 있는 경우 환산
ALIAS = {"Modal": "Dialog"}


def kebab_to_pascal(name: str) -> str:
    return "".join(p.capitalize() for p in name.split("-"))


def load_ds(ui_dir: str) -> set[str]:
    ds: set[str] = set()
    for m in glob.glob(os.path.join(ui_dir, "*.manifest.json")):
        ds.add(kebab_to_pascal(os.path.basename(m).replace(".manifest.json", "")))
    return ds


def frontmatter(path: str) -> str:
    m = re.search(r"^---\n(.*?)\n---", open(path).read(), re.S)
    return m.group(1) if m else ""


def scan(ia_dir: str):
    # flat(screens/x.md, flows/x.md)·중첩(screens/x/x.md, screens/x/flows/y.md) 둘 다 잡는다.
    # legacy/ 는 screens/·flows/ 하위가 아니라 자연 제외 (폐기 IA 는 스캔 대상 아님).
    files = sorted(
        glob.glob(os.path.join(ia_dir, "screens", "**", "*.md"), recursive=True)
        + glob.glob(os.path.join(ia_dir, "flows", "**", "*.md"), recursive=True)
    )
    host: dict[str, str] = {}
    recs: list[tuple[str, list[str]]] = []
    for f in files:
        fm = frontmatter(f)
        fid = re.search(r"^id:\s*(\S+)", fm, re.M).group(1)
        ins = re.search(r"^in_screen:\s*(\S+)", fm, re.M)
        host[fid] = ins.group(1) if ins else fid  # 플로우 접기
        block = re.search(r"^components:\s*\n(.*?)(?=^\S|\Z)", fm + "\n", re.S | re.M)
        comps: list[str] = []
        if block:
            for line in block.group(1).splitlines():
                s = line.split("#", 1)[0].strip()  # 인라인 주석 제거
                mm = re.match(r"-\s*(\w+)", s)
                if mm:
                    comps.append(mm.group(1))
        recs.append((fid, comps))
    return files, host, recs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ia", required=True, help="IA 디렉토리 (screens/ flows/ 포함)")
    ap.add_argument("--ui", required=True, help="DS manifest 디렉토리 (components/ui)")
    ap.add_argument("--threshold", type=int, default=2)
    args = ap.parse_args()

    ds = load_ds(args.ui)
    files, host, recs = scan(args.ia)

    screens: dict[str, set[str]] = defaultdict(set)
    for fid, comps in recs:
        for c in comps:
            screens[c].add(host[fid])

    def is_ds(c: str) -> bool:
        return c in ds or ALIAS.get(c, c) in ds

    print(f"IA 파일 {len(files)} (플로우는 host 로 접음) | DS 원자 {len(ds)}\n")
    print(f"{'component':20}{'화면수':>6}  DS?  거취")
    promoted: list[tuple[str, list[str]]] = []
    for c, ss in sorted(screens.items(), key=lambda x: (-len(x[1]), x[0])):
        n = len(ss)
        if is_ds(c):
            verdict = "원자 (차감)"
        elif n >= args.threshold:
            verdict = "**공통 승격**"
            promoted.append((c, sorted(ss)))
        else:
            verdict = "페이지 로컬"
        print(f"{c:20}{n:>6}  {'DS' if is_ds(c) else '— '}   {verdict}")

    print("\n승격(비-DS, ≥%d 화면):" % args.threshold)
    if promoted:
        for c, ss in promoted:
            print(f"  - {c}  appears_in: {', '.join(ss)}")
    else:
        print("  (없음 — 성급한 추상화 방지)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
