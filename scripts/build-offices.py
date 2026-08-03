#!/usr/bin/env python3
"""data/offices.json из ice-offices.parquet (Deportation Data Project).

Публичный справочник офисов ICE: куда обращаться / где отмечаться.
Только официальные поля — имя, тип, адрес, город, штат, зона (AOR).
Персональных данных нет; сырой parquet в репозиторий не кладём.
"""
import json
import sys
from pathlib import Path

import pyarrow.parquet as pq

SRC = sys.argv[1] if len(sys.argv) > 1 else "deportationdata/ice-offices/ice-offices.parquet"
OUT = Path(__file__).resolve().parent.parent / "data" / "offices.json"


def main():
    t = pq.read_table(SRC)
    cols = {c: t.column(c).to_pylist() for c in t.column_names}
    rows = []
    for i in range(t.num_rows):
        addr = cols.get("address_full", [None] * t.num_rows)[i] or cols["address"][i]
        if not addr:
            continue
        rows.append(
            {
                "name": cols.get("office_name_short", [None] * t.num_rows)[i] or cols["office_name"][i],
                "type": cols["office_type"][i] or "",
                "aor": cols.get("field_office_name", [None] * t.num_rows)[i] or "",
                "address": addr,
                "city": cols["city"][i] or "",
                "state": cols["state"][i] or "",
            }
        )
    rows.sort(key=lambda r: (r["state"], r["city"], r["name"]))
    OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    import collections

    by = collections.Counter(r["type"] for r in rows)
    print(f"offices.json: {len(rows)} офисов, {len(set(r['state'] for r in rows))} штатов, типы: {dict(by)}")


if __name__ == "__main__":
    main()
