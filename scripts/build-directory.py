#!/usr/bin/env python3
"""Собрать data/directory.json из parquet Deportation Data Project.

Источник: deportationdata.org → набор «Detention facility locations»
(facilitieslatest.parquet). Обновляется ~раз в месяц. Фильтр оставляет
реальные детеншн-центры для свиданий: без hold room'ов, staging,
офисов ICE и мест, где за год держали единицы.

Использование:
    pip install pyarrow
    python3 scripts/build-directory.py path/to/facilitieslatest.parquet

Перезаписывает data/directory.json. После — обновите дату в
content/{ru,en,es}/ui.ts (visitFinder.provenance) и в
docs/RESEARCH-facilities-2026.md.
"""
import sys
import re
import json
from pathlib import Path

import pyarrow.parquet as pq

STOP = re.compile(
    r"\bhold\b|hold room|staging|hospital|coord|removal operation|"
    r"border patrol|port of entry|checkpoint|\bcbp\b|field office|"
    r"sub[- ]?office|transportation",
    re.I,
)
MIN_MAX_DAILY = 25


def keep(r):
    code = str(r.get("detention_facility_code") or "")
    if code.upper().endswith("HOLD"):
        return False
    if STOP.search(r.get("name") or ""):
        return False
    if (r.get("max_daily_population_last_year") or 0) < MIN_MAX_DAILY:
        return False
    if not r.get("address_full"):
        return False
    return True


def s(v):
    return str(v).strip() if v is not None else ""


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: build-directory.py path/to/facilitieslatest.parquet")
    rows = pq.read_table(sys.argv[1]).to_pylist()
    out = [
        {
            "code": s(r.get("detention_facility_code")),
            "name": s(r.get("name")),
            "address": s(r.get("address")),
            "city": s(r.get("city")),
            "county": s(r.get("county")),
            "state": s(r.get("state")),
            "zip": s(r.get("zip")),
            "circuit": s(r.get("federal_court_circuit_of_confinement")),
            "field_office": s(r.get("field_office")),
        }
        for r in rows
        if keep(r)
    ]
    out.sort(key=lambda x: x["name"].lower())
    dest = Path(__file__).resolve().parent.parent / "data" / "directory.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"directory.json: {len(out)} учреждений, {len({x['state'] for x in out})} штатов")


if __name__ == "__main__":
    main()
