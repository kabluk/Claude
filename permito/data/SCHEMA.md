# Normalized permit data contract

Each city snapshot lives at `permito/data/cities/<citySlug>.json`:

```json
{
  "city": "chicago",
  "cityName": "Chicago",
  "state": "IL",
  "stateName": "Illinois",
  "source": {
    "name": "Chicago Data Portal — Building Permits",
    "portal": "https://data.cityofchicago.org",
    "dataset": "ydr8-5enu",
    "url": "https://data.cityofchicago.org/resource/ydr8-5enu.json"
  },
  "fetchedAt": "2026-08-13T00:00:00Z",
  "permits": [
    {
      "id": "B200506822",
      "issuedDate": "2026-08-12",
      "type": "Electrical Work",
      "workClass": "Express Permit",
      "description": "LINE VOLTAGE ELECTRICAL WORK ...",
      "address": "1746 N Stockton Dr",
      "zip": "60614",
      "valuation": 12000,
      "contractor": "ACME ELECTRIC LLC",
      "status": "ACTIVE"
    }
  ]
}
```

Rules:
- `issuedDate` — ISO `YYYY-MM-DD`, permits sorted newest first.
- `valuation` — number in USD or `null` when the source has no reported cost / reports 0.
- `contractor` — best-effort contractor/permittee business name, `null` if absent.
- Strings trimmed; addresses title-cased where the source shouts in ALL CAPS.
- Only permits **issued within the last 90 days** are included; target 400–800 records per city.
- Fields never contain raw HTML.
