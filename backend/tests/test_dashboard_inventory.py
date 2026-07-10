"""Dashboard, inventory, forecast, operational, district and reporting reads."""
from __future__ import annotations


def _counts(client):
    n_phcs = len(client.get("/api/phcs").json())
    n_meds = len(client.get("/api/medicines").json())
    return n_phcs, n_meds


def test_dashboard_summary(client):
    j = client.get("/api/dashboard/summary").json()
    assert j["kpis"]["beds_total"] > 0


def test_inventory(client):
    n_phcs, n_meds = _counts(client)
    j = client.get("/api/inventory").json()
    assert len(j) == n_phcs * n_meds
    assert "data_confidence" in j[0]


def test_inventory_risk(client):
    r = client.get("/api/inventory/risk")
    assert r.status_code == 200


def test_confidence_spread(client):
    """Seeded snapshots deliberately span multiple data-confidence tiers."""
    j = client.get("/api/inventory").json()
    assert len({x["data_confidence"] for x in j}) >= 3


def test_forecast(client):
    j = client.get("/api/forecast?phc_id=PHC-01&medicine_id=MED-02").json()
    assert len(j["forecast"]) == 14


def test_forecast_metrics(client):
    j = client.get("/api/forecast/metrics").json()
    assert "metrics" in j


def test_alerts(client):
    j = client.get("/api/alerts").json()
    assert isinstance(j, list)


def test_reports_summary(client):
    j = client.get("/api/reports/summary").json()
    assert "waste_avoided_units" in j


def test_beds(client):
    n_phcs, _ = _counts(client)
    j = client.get("/api/beds").json()
    assert len(j) == n_phcs


def test_footfall(client):
    j = client.get("/api/footfall").json()
    assert "series" in j


def test_doctors(client):
    j = client.get("/api/doctors").json()
    assert len(j) > 0


def test_tests(client):
    n_phcs, _ = _counts(client)
    j = client.get("/api/tests").json()
    assert len(j) == n_phcs * 8


def test_district_overview(client):
    n_phcs, _ = _counts(client)
    j = client.get("/api/district/overview").json()
    assert len(j["phc_scores"]) == n_phcs
