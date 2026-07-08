"""End-to-end smoke test: boot app, seed DB, exercise every endpoint group
including the full human-in-the-loop approval lifecycle."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

checks = []


def check(name, resp, validate=lambda j: True):
    ok = resp.status_code == 200
    try:
        j = resp.json()
        ok = ok and validate(j)
    except Exception as e:  # noqa: BLE001
        ok, j = False, str(e)
    checks.append((name, ok, resp.status_code))
    return resp.json() if resp.status_code == 200 else None


def main() -> int:
    with TestClient(app) as c:
        check("health", c.get("/api/health"), lambda j: j["status"] == "ok")
        check("phcs", c.get("/api/phcs"), lambda j: len(j) == 8 and "digital_maturity" in j[0])
        check("medicines", c.get("/api/medicines"),
              lambda j: len(j) == 15 and any(m["cold_chain"] for m in j))
        check("dashboard", c.get("/api/dashboard/summary"),
              lambda j: j["kpis"]["beds_total"] > 0)
        inv = check("inventory", c.get("/api/inventory"),
                    lambda j: len(j) == 120 and "data_confidence" in j[0])
        check("inventory/risk", c.get("/api/inventory/risk"))
        check("forecast", c.get("/api/forecast?phc_id=PHC-01&medicine_id=MED-02"),
              lambda j: len(j["forecast"]) == 14)
        met = check("forecast/metrics", c.get("/api/forecast/metrics"), lambda j: "metrics" in j)
        recs = check("recommendations", c.get("/api/recommendations"),
                     lambda j: isinstance(j, list) and all(
                         r["status"] == "awaiting_verification" for r in j))
        check("recs/open filter", c.get("/api/recommendations?status=open"))
        rts = check("recs/return-to-store", c.get("/api/recommendations?transfer_type=return_to_store"),
                    lambda j: isinstance(j, list))
        check("alerts", c.get("/api/alerts"), lambda j: isinstance(j, list))
        check("reports", c.get("/api/reports/summary"), lambda j: "waste_avoided_units" in j)
        check("beds", c.get("/api/beds"), lambda j: len(j) == 8)
        check("footfall", c.get("/api/footfall"), lambda j: "series" in j)
        check("doctors", c.get("/api/doctors"), lambda j: len(j) > 0)
        check("tests", c.get("/api/tests"), lambda j: len(j) == 64)
        check("district", c.get("/api/district/overview"), lambda j: len(j["phc_scores"]) == 8)

        # --- data-confidence spread present ---
        confs = {i["data_confidence"] for i in inv}
        check("confidence spread", c.get("/api/inventory"),
              lambda j: len({x["data_confidence"] for x in j}) >= 3)

        # --- full approval lifecycle on one recommendation ---
        gen = check("recs/generate", c.post("/api/recommendations/generate", json={}),
                    lambda j: len(j) > 0)
        rid = next(r["recommendation_id"] for r in gen if r["transfer_type"] == "redistribution")
        check("verify", c.post(f"/api/recommendations/{rid}/verify", json={"verified_by": "pharm"}),
              lambda j: j["status"] == "awaiting_approval" and j["verified_at"])
        # approve before verify should be blocked on a *different* fresh rec
        rid2 = next(r["recommendation_id"] for r in gen
                    if r["transfer_type"] == "redistribution" and r["recommendation_id"] != rid
                    and not r["emergency"])
        r_block = c.post(f"/api/recommendations/{rid2}/approve", json={})
        checks.append(("approve-before-verify blocked (409)", r_block.status_code == 409, r_block.status_code))
        check("approve", c.post(f"/api/recommendations/{rid}/approve",
                                json={"approved_by": "mgr", "actual_qty": 40}),
              lambda j: j["status"] == "approved" and j["actual_qty"] == 40)
        check("assign", c.post(f"/api/recommendations/{rid}/assign", json={}),
              lambda j: j["status"] == "assigned")
        check("pickup", c.post(f"/api/recommendations/{rid}/pickup", json={}),
              lambda j: j["status"] == "picked_up")
        check("confirm+stock update", c.post(f"/api/recommendations/{rid}/confirm",
                                             json={"received_qty": 40, "received_condition": "good"}),
              lambda j: j["status"] == "stock_updated")
        tl = check("timeline", c.get(f"/api/recommendations/{rid}/timeline"),
                   lambda j: len(j) >= 5)
        # reject requires a reason
        r_noreason = c.post(f"/api/recommendations/{rid2}/reject", json={"reason": ""})
        checks.append(("reject-without-reason (400)", r_noreason.status_code == 400, r_noreason.status_code))
        check("reject", c.post(f"/api/recommendations/{rid2}/reject",
                               json={"reason": "transport unavailable"}),
              lambda j: j["status"] == "rejected")

        # --- ingestion fallbacks ---
        check("ingest/sms", c.post("/api/ingest/sms",
                                   json={"message": "STOCK PHC-03 ORS 120 EXP 2026-12 BATCH ORS24A"}),
              lambda j: j["ok"] and j["stock_qty"] == 120 and j["updated_via"] == "sms")
        check("ingest/sms short", c.post("/api/ingest/sms",
                                         json={"message": "PHC-05 Paracetamol 300 09-2026"}),
              lambda j: j["ok"] and j["stock_qty"] == 300)
        check("ingest/csv", c.post("/api/ingest/csv", json={
            "csv": "phc_id,medicine_id,stock_qty,batch_no,expiry_date,snapshot_date\n"
                   "PHC-01,MED-01,150,B999,2026-10-15,2026-07-08\n"}),
              lambda j: j["ok"] and j["inserted"] == 1)
        # strict-format SMS is handled by the regex parser (no AI needed)
        check("ingest/sms parsed_by=regex", c.post("/api/ingest/sms",
              json={"message": "STOCK PHC-03 ORS 120 EXP 2026-12 BATCH ORS24A"}),
              lambda j: j["ok"] and j["parsed_by"] == "regex")

        # --- AI assistant + briefing (keyless => deterministic fallback) ---
        check("assistant/status", c.get("/api/assistant/status"),
              lambda j: j["gemini_enabled"] is False and j["mode"] == "fallback"
              and isinstance(j["model"], str))
        check("assistant/ask", c.post("/api/assistant/ask",
              json={"question": "which centres are most at risk?", "lang": "en"}),
              lambda j: isinstance(j["answer_en"], str) and j["answer_en"]
              and isinstance(j["answer_hi"], str) and j["answer_hi"]
              and j["source"] == "fallback"
              and isinstance(j["grounding"]["critical_items"], int)
              and isinstance(j["grounding"]["open_transfers"], int))
        brief_list = c.get("/api/recommendations").json()
        brid = brief_list[0]["recommendation_id"]
        check("recs/briefing", c.get(f"/api/recommendations/{brid}/briefing"),
              lambda j: bool(j["briefing_en"]) and bool(j["briefing_hi"])
              and j["source"] == "fallback")

    print("\n=== SMOKE TEST RESULTS ===")
    passed = sum(1 for _, ok, _ in checks if ok)
    for name, ok, code in checks:
        print(f"  [{'PASS' if ok else 'FAIL'}] {name:34s} (HTTP {code})")
    print(f"\n{passed}/{len(checks)} checks passed")

    if recs:
        red = [r for r in recs if r["transfer_type"] == "redistribution"]
        ret = [r for r in recs if r["transfer_type"] == "return_to_store"]
        print(f"\nRecommendations: {len(red)} redistribution + {len(ret)} return-to-store")
        r = red[0]
        print(f"  Top: {r['suggested_qty']} {r['unit']} {r['medicine_name']} "
              f"{r['source_phc_name']} -> {r['target_phc_name']}")
        print(f"    urgency={r['urgency']} logistics={r['logistics_model']} "
              f"escalation={r['escalation_level']} confidence={r['confidence']} "
              f"buffer_after={r['source_buffer_days_after']}d")
        print(f"    reason(EN): {r['reason_en']}")
    if met and met.get("metrics"):
        print(f"\nForecast: {met['model']} {met['metrics']} vs baseline {met['baseline_metrics']} "
              f"(+{met['improvement_pct']}%)")
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
