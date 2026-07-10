"""Fetch a real dataset from data.gov.in (Open Government Data Platform, India).

This makes the project's "we use real government data" claim runnable: it pulls a
live resource from the OGD API and caches it as CSV under ``data/real/raw/``. It
follows the same graceful-degradation philosophy as the rest of the app — if no
API key is configured or the network/API is unavailable, it leaves the committed
reference CSVs in place and exits cleanly (the demo still runs on cached data).

Why a key is needed: data.gov.in issues a free personal API key. The public
"sample" key is shared and heavily rate-limited, so real use needs your own.
Get one (free) at https://data.gov.in  ->  Sign In  ->  My Account  ->  API key.

Usage (PowerShell):
    $env:DATAGOVIN_API_KEY = "your_key"
    python scripts/fetch_datagovin.py --resource-id <uuid> --out phc_chc_counts.csv

Find a resource id: open the dataset page on data.gov.in, click the API tab —
the id is the UUID in the api.data.gov.in/resource/<uuid> URL. Examples relevant
to this project (health track):
  - "State/UTs-wise Number of PHCs, CHCs Functioning (RHS)"  (Rural Health Statistics)
  - Health facility / hospital directory datasets
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

API_ROOT = "https://api.data.gov.in/resource"
# Public sample key — accepted but globally rate-limited. Override with your own.
SAMPLE_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "real" / "raw"


def fetch(resource_id: str, api_key: str, limit: int = 1000) -> list[dict]:
    url = (f"{API_ROOT}/{resource_id}?api-key={api_key}"
           f"&format=json&limit={limit}&offset=0")
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode())
    if payload.get("status") == "error":
        raise RuntimeError(payload.get("message", "data.gov.in returned an error"))
    records = payload.get("records", [])
    if not records:
        raise RuntimeError("No records returned (check the resource id).")
    return records


def write_csv(records: list[dict], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fields: list[str] = []
    for r in records:
        for k in r:
            if k not in fields:
                fields.append(k)
    with out_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(records)


def main() -> int:
    p = argparse.ArgumentParser(description="Fetch a real data.gov.in resource to CSV.")
    p.add_argument("--resource-id", default=os.getenv("DATAGOVIN_RESOURCE_ID"),
                   help="OGD resource UUID (from the dataset's API tab).")
    p.add_argument("--out", default="datagovin_resource.csv",
                   help="Output filename under data/real/raw/.")
    p.add_argument("--limit", type=int, default=1000)
    args = p.parse_args()

    api_key = os.getenv("DATAGOVIN_API_KEY", SAMPLE_KEY)
    using_sample = api_key == SAMPLE_KEY

    if not args.resource_id:
        print("No --resource-id / DATAGOVIN_RESOURCE_ID given. Nothing to fetch.\n"
              "The project runs on the committed reference CSVs in data/real/ regardless.\n"
              "See this file's docstring for how to find a resource id.")
        return 0

    if using_sample:
        print("[note] Using the shared public sample key (rate-limited). Set "
              "DATAGOVIN_API_KEY to your own free key for reliable pulls.")

    out_path = DATA_DIR / args.out
    try:
        records = fetch(args.resource_id, api_key, args.limit)
        write_csv(records, out_path)
        print(f"[ok] Fetched {len(records)} records -> {out_path}")
        return 0
    except (urllib.error.URLError, RuntimeError, TimeoutError) as e:
        print(f"[skip] Live fetch failed ({e}).\n"
              "Falling back to the committed reference CSVs in data/real/ - the demo is unaffected.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
