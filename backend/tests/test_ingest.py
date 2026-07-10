"""Stock ingestion fallbacks: SMS (regex parser) and CSV."""
from __future__ import annotations


def test_ingest_sms_strict(client):
    j = client.post("/api/ingest/sms",
                    json={"message": "STOCK PHC-03 ORS 120 EXP 2026-12 BATCH ORS24A"}).json()
    assert j["ok"]
    assert j["stock_qty"] == 120
    assert j["updated_via"] == "sms"


def test_ingest_sms_short(client):
    j = client.post("/api/ingest/sms",
                    json={"message": "PHC-05 Paracetamol 300 09-2026"}).json()
    assert j["ok"]
    assert j["stock_qty"] == 300


def test_ingest_sms_parsed_by_regex(client):
    j = client.post("/api/ingest/sms",
                    json={"message": "STOCK PHC-03 ORS 120 EXP 2026-12 BATCH ORS24A"}).json()
    assert j["ok"]
    assert j["parsed_by"] == "regex"


def test_ingest_csv(client):
    j = client.post("/api/ingest/csv", json={
        "csv": "phc_id,medicine_id,stock_qty,batch_no,expiry_date,snapshot_date\n"
               "PHC-01,MED-01,150,B999,2026-10-15,2026-07-08\n"}).json()
    assert j["ok"]
    assert j["inserted"] == 1
