"""Stock redistribution optimizer.

Given per-PHC surplus (donors) and deficit (receivers) for a single medicine,
compute transfers that minimise a weighted cost of shortage, expiry waste, and
transport distance while respecting donor safety stock (surplus is already
net-of-safety-stock) and receiver need.

Primary solver: Google OR-Tools linear solver (a min-cost transportation LP).
If OR-Tools is unavailable it transparently falls back to a greedy
nearest-donor heuristic, so recommendations are always produced.
"""
from __future__ import annotations

from dataclasses import dataclass

try:  # pragma: no cover - environment dependent
    from ortools.linear_solver import pywraplp  # type: ignore

    _HAS_ORTOOLS = True
except Exception:  # noqa: BLE001
    _HAS_ORTOOLS = False


@dataclass
class Donor:
    phc_id: str
    surplus: float          # units available to give (already net of safety stock)
    days_to_expiry: int     # smallest batch expiry; lower = more urgent to move


@dataclass
class Receiver:
    phc_id: str
    deficit: float          # units short of (forecast demand + safety stock)
    urgency: float          # 0..1, higher = more critical (fewer days of cover)


@dataclass
class Transfer:
    source_phc_id: str
    target_phc_id: str
    qty: int
    distance_km: float


def _expiry_bonus(days_to_expiry: int) -> float:
    """Cost discount for moving near-expiry stock (encourages waste avoidance)."""
    if days_to_expiry <= 30:
        return 0.4
    if days_to_expiry <= 60:
        return 0.7
    return 1.0


def optimize(
    donors: list[Donor],
    receivers: list[Receiver],
    distance: dict[tuple[str, str], float],
    solver_engine: str | None = None,
) -> list[Transfer]:
    donors = [d for d in donors if d.surplus >= 1]
    receivers = [r for r in receivers if r.deficit >= 1]
    if not donors or not receivers:
        return []

    use = solver_engine or ("ortools" if _HAS_ORTOOLS else "greedy")
    if use == "ortools" and _HAS_ORTOOLS:
        result = _solve_lp(donors, receivers, distance)
        if result is not None:
            return result
    return _solve_greedy(donors, receivers, distance)


def _cost(d: Donor, r: Receiver, distance: dict) -> float:
    dist = distance.get((d.phc_id, r.phc_id), 50.0)
    # cheaper to serve urgent receivers and to move near-expiry donor stock
    return (dist + 1.0) * _expiry_bonus(d.days_to_expiry) * (1.5 - r.urgency)


def _solve_lp(donors, receivers, distance) -> list[Transfer] | None:
    solver = pywraplp.Solver.CreateSolver("GLOP")
    if solver is None:
        return None
    x = {}
    for d in donors:
        for r in receivers:
            if d.phc_id == r.phc_id:
                continue
            x[(d.phc_id, r.phc_id)] = solver.NumVar(0, solver.infinity(), f"x_{d.phc_id}_{r.phc_id}")

    for d in donors:  # supply
        terms = [x[(d.phc_id, r.phc_id)] for r in receivers if (d.phc_id, r.phc_id) in x]
        if terms:
            solver.Add(solver.Sum(terms) <= d.surplus)
    for r in receivers:  # demand
        terms = [x[(d.phc_id, r.phc_id)] for d in donors if (d.phc_id, r.phc_id) in x]
        if terms:
            solver.Add(solver.Sum(terms) <= r.deficit)

    # maximise satisfied demand, minus transport/expiry-weighted cost
    obj = []
    for (s, t), var in x.items():
        d = next(dd for dd in donors if dd.phc_id == s)
        r = next(rr for rr in receivers if rr.phc_id == t)
        obj.append((100.0 - _cost(d, r, distance)) * var)
    solver.Maximize(solver.Sum(obj))

    if solver.Solve() != pywraplp.Solver.OPTIMAL:
        return None

    transfers: list[Transfer] = []
    for (s, t), var in x.items():
        qty = int(round(var.solution_value()))
        if qty >= 1:
            transfers.append(Transfer(s, t, qty, distance.get((s, t), 0.0)))
    return transfers


def _solve_greedy(donors, receivers, distance) -> list[Transfer]:
    """Serve most-urgent receivers first from the cheapest available donor."""
    supply = {d.phc_id: d.surplus for d in donors}
    donor_by_id = {d.phc_id: d for d in donors}
    transfers: list[Transfer] = []
    for r in sorted(receivers, key=lambda rr: rr.urgency, reverse=True):
        need = r.deficit
        candidates = sorted(
            (d for d in donors if supply[d.phc_id] >= 1 and d.phc_id != r.phc_id),
            key=lambda d: _cost(d, r, distance),
        )
        for d in candidates:
            if need < 1:
                break
            give = min(supply[d.phc_id], need)
            qty = int(round(give))
            if qty < 1:
                continue
            supply[d.phc_id] -= qty
            need -= qty
            transfers.append(Transfer(d.phc_id, r.phc_id, qty, distance.get((d.phc_id, r.phc_id), 0.0)))
    return transfers


def solver_name() -> str:
    return "ortools" if _HAS_ORTOOLS else "greedy"
