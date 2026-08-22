from pathlib import Path
from urllib.parse import urlencode
import requests

BASE = "https://infengi.ru/qm"
OUT = Path("/home/ubuntu/Oracle2.1-repo/docs/infengi-period-benchmarks")
OUT.mkdir(parents=True, exist_ok=True)

# The same Moscow / UTC+3 parameters are used for every request.
common = {
    "bzDataOld": "",
    "sistem": "1",
    "city": "Москва, Россия",
    "utc": "3.00",
    "lat": "55.755826",
    "lng": "37.6173",
    "bzName": "",
    "bzPol": "1",
    "pro": "0",
}
points = (
    [("year", f"{y}-12-15") for y in range(2024, 2029)]
    + [("month", f"2026-{m:02d}-15") for m in (1, 4, 7, 10)]
    + [("day", d) for d in ("2026-06-21", "2026-07-07", "2026-08-07", "2026-08-21", "2026-09-23")]
)

for kind, iso in points:
    date = ".".join(reversed(iso.split("-")))
    params = {**common, "bzData": date, "bzDataOld": date}
    url = BASE + "?" + urlencode(params)
    path = OUT / f"{kind}-{iso}.html"
    if path.exists() and path.stat().st_size > 1000:
        print("cached", kind, iso, path)
        continue
    response = requests.get(url, timeout=12, headers={"User-Agent": "Mozilla/5.0"})
    response.raise_for_status()
    path.write_text(response.text, encoding=response.encoding or "utf-8")
    print(kind, iso, response.status_code, len(response.text), path)
