# Data Provenance — Bareilly Health Supply-Chain Project

This document records the exact source, vintage, and caveats for every "real" dataset
in `data/real/`. It also states clearly which parts of the wider project are SIMULATED.

**Scope:** Bareilly district, Uttar Pradesh, India.
**Compiled:** 2026-07-08.
**Honesty principle:** Every figure in `data/real/` is a real, published government/official
statistic with a working source URL. No value was invented to fill a cell. Where a
district-specific figure was not available, a state (UP) or tehsil-level figure was used
and is explicitly labelled. Gaps are documented below rather than filled with guesses.

---

## 1. `real/bareilly_blocks.csv` — Administrative blocks (Census 2011)

- **Rows:** 15 Community Development (CD) blocks (the full set for Bareilly district).
- **Population source (authoritative, primary):** Census of India 2011 — District Census
  Handbook (DCHB), Uttar Pradesh, Series-10, Part XII-B, District Bareilly.
  Village Directory release file `DH_2011_DCHB_Village_Release_0900.xlsx`.
  Catalog: https://censusindia.gov.in/nada/index.php/catalog/1185
- **Method:** `rural_population_2011` = sum of "Total Population of Village" over all villages
  in each `CD Block Name` for district Bareilly, taken directly from the official DCHB
  village-directory Excel. CD blocks are rural-only administrative units, so the block
  total IS the rural population.
- **Validation:** The 15 block totals sum to **exactly 2,879,950**, which equals the official
  Census 2011 rural population of Bareilly district (district total 4,448,359; rural 2,879,950;
  urban 1,568,409). This exact match independently confirms the block figures and the
  block list. Computed twice (research agent + independent re-aggregation of the same file).
- **Tehsil mapping:** Derived from the sub-district recorded for the majority of each block's
  villages in the same DCHB file. Blocks per tehsil — Aonla: Majhgawan, Alampur Jafarabad,
  Ramnagar; Baheri: Baheri, Shergarh, Richha; Bareilly (Sadar): Bithri Chainpur, Bhojipura,
  Kyara; Faridpur: Bhuta, Faridpur; Meerganj: Meerganj, Fatehganj Pashchimi; Nawabganj:
  Nawabganj, Bhadpura.
- **CAVEAT — coordinates are APPROXIMATE and NOT from the census.** `latitude`/`longitude`
  are approximate locations of each block-HQ town taken from public geographic gazetteers
  (Wikipedia, latitude.to, indiamapia, mindat, mappls). They are indicative only.
  `Kyara` HQ coordinates were left blank because no reliable coordinate could be verified
  (do not guess). All other coordinates should be treated as ±a few km.
- **NOTE on the block list:** "Damkhoda/Damkhauda" is NOT a CD block in the 2011 DCHB
  (likely a gram panchayat / old name) and was excluded. The verified 15 blocks include
  Richha and Bithri Chainpur. Census spellings: Meerganj = "Mirganj"; Alampur Jafarabad =
  "Aalampur Jafarabad"; Fatehganj Pashchimi = "Fatehganj Pashchim / Fatehganj West".
- **Tehsil-level cross-reference (rural population, Census 2011),** verified to sum to the
  district rural total (2,879,950) — Bareilly Sadar 531,985; Aonla 605,703; Baheri 540,473;
  Meerganj 404,416; Nawabganj 412,736; Faridpur 384,637. Source (tehsil totals + rural/urban):
  https://www.censusindia2011.com/uttar-pradesh/bareilly-population.html and per-tehsil pages.
  (These are a cross-check only; the CSV uses the more granular block-level DCHB figures.)

## 2. `real/bareilly_health_indicators.csv` — NFHS-5 (2019-21) indicators

- **Rows:** 23 indicators (22 Bareilly-district-specific + 1 UP-state fallback).
- **Survey:** National Family Health Survey 5 (NFHS-5), fieldwork 2019-21, IIPS / MoHFW.
- **Primary source (district factsheet values):** NFHS-5 Bareilly District Factsheet
  (~104 indicators). Values taken from a faithful public extraction of the official
  Phase-2 district factsheets:
  https://raw.githubusercontent.com/jvargh7/nfhs5_factsheets/main/data%20for%20analysis/districts.csv
  (Bareilly rows). Every value in the CSV was read directly from this file.
- **Independent official validation:** The same district numbers were cross-checked against
  the official IIPS **FR374 — Uttar Pradesh NFHS-5 report** (district tables 47/55/60/72/81),
  https://upnrhm.gov.in/NHM-Doc/NFHS/NFHS/NFHS-5(FY%202019-21)Report.pdf
  (identical to dhsprogram.com FR374_UTTARPRADESH.pdf). Nutrition/anaemia figures
  (stunted 45.9, wasted 15.4, underweight 35.2, child anaemia 67.7, women anaemia 60.8)
  matched exactly. A few "provisional" factsheet values differ from FR374 "final" values by
  1-2 points (e.g. institutional births 75.1 provisional vs 73.3 final; the CSV uses the
  factsheet/provisional value, which is the district-factsheet figure).
- **CAVEAT — Total Fertility Rate is UP-STATE, not district.** TFR is not published at
  district level in NFHS-5. The CSV row for TFR (2.4) is the Uttar Pradesh state value and is
  labelled "UP state (NFHS-5)" in the `source` column. Source: FR374 UP report (above).
- **Access note:** The canonical standalone factsheet PDF is served only via a JavaScript
  portal (https://www.nfhsiips.in/nfhsuser/districtfactsheet.php; the old rchiips.org path is
  retired), so a static PDF link is not available; the extraction CSV above is a faithful,
  validated mirror.

## 3. `real/up_rhs_infrastructure.csv` — Rural Health Statistics, Uttar Pradesh

- **Rows:** 17 (13 UP-specific + 2 national-context, clearly labelled + specialist breakdown).
- **Primary source:** Rural Health Statistics 2021-22, Ministry of Health & Family Welfare
  (data as on 31 March 2022; report released 12 Jan 2023). The official HMIS host
  (hmis.mohfw.gov.in) returned HTTP 500 to automated requests, so the report PDF was read via
  the Internet Archive snapshot (verified to download and parse):
  http://web.archive.org/web/20230419102751/https://hmis.mohfw.gov.in/downloadfile?filepath=publications/Rural-Health-Statistics/RHS%202021-22.pdf
- **UP figures read directly from the report** (Comparative Statements 1, 6, 7 / Tables 16, 23):
  Sub-Centres 20,781; PHCs 2,919; CHCs 829 (as on 31.03.2022); CHC increase since 2005 = +443
  (386 -> 829); Allopathic doctors at PHCs in position 2,890 (shortfall vs requirement 29 ≈ 1.0%;
  vacancy vs sanctioned 1,558 ≈ 35.0%); Total specialists at CHCs required 3,316, in position 918,
  shortfall 2,398 ≈ 72.3%, vacancy 2,028 ≈ 68.8%.
- **Cross-check:** The four CHC specialist-category shortfalls reported by ETV Bharat from the
  same RHS 2021-22 (surgeons 635 + ob-gyn 625 + physicians 493 + paediatricians 645 = 2,398)
  sum exactly to the total specialist shortfall (2,398) read from the report PDF. Those four
  category rows cite ETV Bharat:
  https://www.etvbharat.com/english/bharat/states-across-india-facing-shortfall-of-surgeons-at-community-health-centre-rural-health-statistics-2021-22/na20230113215327970970325
- **National-context rows** (India allopathic-doctor shortfall 3.1%; India specialist shortfall
  79.5%) are labelled "INDIA (national context)" and are from the same RHS 2021-22 report.

## 4. `real/nlem_medicines.csv` — Essential medicines (NLEM 2022)

- **Rows:** 23 medicines relevant to rural PHC primary care.
- **Source:** India's National List of Essential Medicines (NLEM) 2022, MoHFW / CDSCO.
  Full list PDF (fetched and text-extracted for verification):
  https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadConsumer/nlem2022.pdf
- **Verification:** Every medicine's presence on NLEM 2022, and its strength/form, was
  confirmed by extracting the NLEM 2022 PDF text and locating each entry (e.g. Paracetamol
  Tablet 500/650 mg; Cetirizine Tablet 10 mg; Oxytocin Injection 10 IU/mL; Insulin Soluble
  Injection 40 IU/mL; Measles/DPT vaccines under Section 19 Immunologicals). `nlem_2022=true`
  for all 23 rows (all verified present).
- **`cold_chain=true`** only for items genuinely requiring 2-8 °C storage: Oxytocin, Insulin
  (Soluble), Measles vaccine, DPT vaccine. All others `false`.

---

## SIMULATED data (NOT real) — explicit honesty statement

The operational supply-chain files used by the application — in particular any **daily/periodic
PHC-level medicine stock levels, consumption/usage ledgers, inventory snapshots, and
reorder events** (e.g. `data/inventory_snapshot.csv`, `data/usage_history.csv`, and any
generated stock/demand time-series) — are **SIMULATED / synthetic**.

No open government dataset publishes PHC-level daily stock ledgers or dispensing records for
Bareilly (or any Indian district) at the granularity a supply-chain tool needs. India's
drug-logistics systems (e.g. DVDMS / e-Aushadhi) are not published as open daily data.
Therefore stock and usage figures are modelled — plausibly parameterised using the REAL
context in `data/real/` (block rural populations, NFHS-5 disease/health burden, RHS facility
counts, and the NLEM medicine list) — but they are NOT real observations and must not be
presented as government data. Only the four files in `data/real/` (plus this document's cited
figures) are real.
