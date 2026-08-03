#!/usr/bin/env python3
"""Считает статистику длительности содержания по учреждениям из
detention-stays-latest.parquet (Deportation Data Project, FOIA-данные ICE).

Вход — склеенный parquet (см. docs/README про сборку .part). Файл сырой в
репозиторий не кладём; в git идёт только маленький агрегат data/stays.json.

Правила:
- только завершённые стоянки (есть и book-in, и book-out);
- только свежий период (с START_YEAR), чтобы отражать текущую реальность;
- учреждение попадает в вывод при N >= MIN_N (иначе цифра шумная);
- привязка к учреждению — detention_facility_code_longest (где провёл дольше всего).

Вывод data/stays.json:
{
  "meta": { "source": "...", "period": "2024–2026", "generated": "YYYY-MM",
            "nationalMedian": 25, "n": 667791,
            "leave": [["Removed", 63], ["Paroled", 10], ...] },
  "byCode": { "STWRTGA": { "med": 41, "p25": 18, "p75": 73, "n": 19155 }, ... }
}
"""
import json
import sys
import datetime
import collections
from pathlib import Path

import pyarrow.parquet as pq

PARQUET = sys.argv[1] if len(sys.argv) > 1 else "detention-stays-latest.parquet"
START_YEAR = 2024
MIN_N = 100
OUT = Path(__file__).resolve().parent.parent / "data" / "stays.json"


def pct(sorted_list, p):
    return sorted_list[int(p * (len(sorted_list) - 1))]


def main():
    t = pq.read_table(
        PARQUET,
        columns=[
            "stay_book_in_date_time",
            "stay_book_out_date_time",
            "stay_release_reason",
            "detention_facility_code_longest",
        ],
    )
    bi = t.column("stay_book_in_date_time").to_pylist()
    bo = t.column("stay_book_out_date_time").to_pylist()
    rr = t.column("stay_release_reason").to_pylist()
    code = t.column("detention_facility_code_longest").to_pylist()

    cut = datetime.datetime(START_YEAR, 1, 1, tzinfo=datetime.timezone.utc)
    by_code = collections.defaultdict(list)
    all_days = []
    leave = collections.Counter()

    for a, b, reason, c in zip(bi, bo, rr, code):
        if not (a and b) or a < cut:
            continue
        d = (b - a).total_seconds() / 86400
        if not (0 <= d < 3650):
            continue
        all_days.append(d)
        if c:
            by_code[c].append(d)
        if reason:
            leave[reason] += 1

    all_days.sort()
    n_total = len(all_days)

    by = {}
    for c, ds in by_code.items():
        if len(ds) < MIN_N:
            continue
        ds.sort()
        by[c] = {
            "med": round(pct(ds, 0.5)),
            "p25": round(pct(ds, 0.25)),
            "p75": round(pct(ds, 0.75)),
            "n": len(ds),
        }

    leave_top = [[k, round(100 * v / n_total)] for k, v in leave.most_common(6)]

    out = {
        "meta": {
            "source": "Deportation Data Project (FOIA-данные ICE), detention stays",
            "period": f"{START_YEAR}–2026",
            "nationalMedian": round(pct(all_days, 0.5)),
            "n": n_total,
            "minN": MIN_N,
            "leave": leave_top,
        },
        "byCode": dict(sorted(by.items())),
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"stays.json: {len(by)} учреждений, национальная медиана {out['meta']['nationalMedian']} дн, N={n_total:,}")
    print("leave:", leave_top)


if __name__ == "__main__":
    main()
