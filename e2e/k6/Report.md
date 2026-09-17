# Report: k6 Load Test — Supported vs Degradation VUs

**Project:** InternMatch (`front` Next.js) — `localhost`  
**Script:** `e2e/k6/scripts/mixed.js` (40% `GET /` / 30% `POST /api/auth/login` / 30% `GET /dashboard/profile`)  
**Config:** `e2e/k6/config.js:11` — 6 stages `10→50→100→200→300→500` (~4m30s), thresholds `p(95)<500ms`, `http_req_failed<1%`, `checks>99%`  
**Runs:** `DEV` (`next dev`, `front/package.json:6`) vs `PROD` (`next build && next start`)  
**Files:** `results/mixed_summary_dev.json`, `results/mixed_summary_prod.json` (handleSummary, overall aggregates)

> **Limit:** The two JSONs are `handleSummary` overall aggregates (average over all 6 stages). True per-stage `p95/RPS` requires `--out json=results/mixed_raw_*.json` (per-request time-series). This report derives **supported/degradation from overall + group counts** and flags the need for per-VU isolated runs to pinpoint exact VUs.

---

## 1. Overall Results (4m30s, 500 max VUs)

| Env | p95 (ms) | avg (ms) | max (ms) | RPS | iters | http_req_failed | checks | Threshold `p95<500` | Result |
|-----|----------|----------|----------|-----|-------|-----------------|--------|---------------------|--------|
| **DEV** | **22939.4** | 10612.2 | 38554.3 | **17.1/s** | 4669 | 0.059% (3/5051) `PASS` | 99.94% `PASS` | **FAIL** (`22.9s > 0.5s`, ~45x) | **OVERLOAD** |
| **PROD** | **19671.0** | 4674.1 | 39612.9 | **34.8/s** | 9614 | 0% `PASS` | 100% `PASS` | **FAIL** (`19.6s > 0.5s`, ~39x) | **OVERLOAD** |

**Raw:** `e2e/k6/results/mixed_summary_dev.json:92` (`http_req_duration p95 22939`) vs `mixed_summary_prod.json:187` (`p95 19671`).

### Observations

1. **p95 far above SLO in both envs** — even `PROD` is ~39x over `500ms`. Overall average includes the high-VU stages (200–500) which dominate the p95. This indicates `degradation started early` (likely at 50–100 VUs), not just at 500.
2. **PROD is ~2x better than DEV:**
   - Throughput: `34.8/s` vs `17.1/s` (+103%)
   - Iters: `9614` vs `4669` (+106%)
   - Avg latency: `4.67s` vs `10.6s` (-56%)
   - p95: `19.6s` vs `22.9s` (-14%)
   - Errors: `0%` vs `0.059%` — DEV hit 3× `WARN wsarecv: connection forcibly closed` (`k6` TCP reset) that PROD did not.
3. **No HTTP 5xx flood** — both runs stayed `http_req_failed <1%` and `checks>99%`, so the server queued/waited rather than rejected. `http_req_waiting` ≈ `http_req_duration` (DEV 10598ms, PROD 4673ms) confirms **wait-queue bottleneck**, not network.

### Per-Group Breakdown (from `root_group.groups`)

| Group | DEV passes | PROD passes | Note |
|-------|------------|-------------|------|
| `GET /` (`front/app/page.tsx:13`) | 1871 | 3792 | +102% in PROD — lightest endpoint, scales best |
| `POST /api/auth/login` (`front/app/api/auth/login/route.ts:6`, `bcrypt.compare`) | 1385 (+3 fails) | 2951 (0 fails) | +113%, DEV had 3 `login 200` fails + `WARN` TCP resets — auth is the bottleneck |
| `GET /dashboard/profile` (auth, `jwt.verify` + Supabase) | 2174 (382 logins inside) | 3691 (410 logins) | +70% — second bottleneck (DB join) |

**Conclusion per group:** `login` is the first to degrade (3 fails in DEV, none in PROD at same load), consistent with `bcrypt` CPU-bound expectation in `Plan.md:2`.

---

## 2. Supported vs Degradation VUs — Answer for อาจารย์ (Updated with per-VU isolated runs)

> **Updated 2026-09-08:** Isolated runs on **PROD** (`next start`) give exact numbers (see §4 table). This § is now the official answer.

- **Supported VUs (Capacity, `p95<500ms` && `error<1%`):** **10 VUs (PROD, mixed 40/30/30)**
  - Evidence (§4): `VUs=10 → p95 291ms PASS`; `VUs=25 → p95 1095ms FAIL`. SLO is crossed between 10 and 25. No `http_req_failed` at any level, so `p95` is the limiter.
  - DEV (overall `p95 22.9s`) would be even lower (<10), but **report PROD = 10 VUs** as official (prod = what Vercel runs).

- **Degradation VUs (Knee Point, `p95` steep rise / `RPS` flat):** **25 VUs (latency knee), saturation at 50 VUs (throughput flat)**
  - Evidence (§4): `p95 291→1095 (+276%)` at 25 = first steep rise; `RPS 20.4→32.6→32.4` flat at 50–100 = throughput saturation. So: **`degradation starts at 25 VUs, saturates at 50 VUs`**.
  - Overall 6-stage run corroborates: `RPS` flat despite 500 max VUs.

**Short answer to send:**
> **PROD (ส่งอาจารย์):** รองรับได้ **10 VUs** (`p95 291ms`), เริ่ม degrade ที่ **25 VUs** (`p95 1095ms >500ms`), อิ่มตัวที่ **50 VUs** (`RPS 32.6→32.4 flat`) — `DEV` จะแย่กว่า (`overall p95 22.9s`, `RPS 17.1/s`, มี `wsarecv` 3 ครั้ง)

*For `run k6 6`: Report `Supported = 10 VUs, Degradation = 25 VUs (saturation 50 VUs)` — PROD, isolated 30s per level.*

---

## 3. DEV vs PROD Comparison (what to tell อาจารย์)

| Aspect | DEV (`next dev`) | PROD (`next build && next start`) | Why |
|--------|------------------|-----------------------------------|-----|
| **Latency** | p95 22.9s, avg 10.6s | p95 19.6s (-14%), avg 4.67s (-56%) | `dev` has HMR, source maps, unoptimized bundles |
| **Throughput** | 17.1 RPS | 34.8 RPS (+103%) | `prod` optimized RSC, less overhead |
| **Stability** | 3 TCP `wsarecv` resets, 0.059% failed | 0% failed, 100% checks | `dev` event-loop blocked earlier |
| **Iterations** | 4669 | 9614 | PROD completed 2x more work in same 4m30s |

**Takeaway:** For Load Test reports, **use PROD numbers as official** — DEV slowness is not representative of `Vercel` prod. DEV is useful for quick regression, PROD for capacity planning.

---

## 4. Exact Per-VU Results — Executed 2026-09-08 on PROD (`next start`, `localhost:3000`)

> Isolated constant-VU runs were executed as planned. Each run: `scripts/mixed.js` (40/30/30), `sleep(1)`, `BASE_URL=http://localhost:3000`, account `k6_loadtest@example.com`.

| VUs | Duration | p95 (ms) | avg (ms) | max (ms) | RPS | iters | http_req_failed | checks | vs `p95<500ms` | Verdict |
|-----|----------|----------|----------|----------|-----|-------|-----------------|--------|----------------|---------|
| **10** | 30s | **291.2** | 100.9 | 774.6 | 9.1 | 274 | 0% | 100% | **PASS** | ✅ Supported |
| **25** | 30s | **1095.0** | 227.6 | 2260.3 | 20.4 | 610 | 0% | 100% | **FAIL** (2.1×) | ⚠️ Degradation starts |
| **50** | 30s | **1995.6** | 516.7 | 2793.1 | 32.6 | 994 | 0% | 100% | **FAIL** (4×) | ❌ Over SLO |
| **100** | 30s | **7673.2** | 1990.2 | 9164.3 | 32.4 | 982 | 0% | 100% | **FAIL** (15×) | ❌ Saturated |

**Raw logs:** `results/mixed_v10.log`, `mixed_v25.log`, `mixed_v50.log`, `mixed_v100.log` (k6 summary, `C:\Program Files\k6\k6.exe v2.2.0`).

### 4.1 What the per-VU table tells you

1.  **Supported VUs = 10 (PROD, mixed workload)**
    - At 10 VUs: `p95 291ms < 500ms`, `avg 101ms`, `RPS 9.1`. All thresholds PASS. This is the **last VUs that meets SLO**.
    - At 25 VUs: `p95 1095ms` already **2.1× over threshold** (+276% jump from 10→25). So the SLO is crossed **between 10 and 25 VUs**.
    - If you need a single number for `run k6 6`: **`Supported = 10 VUs`**.

2.  **Degradation VUs = 25 (knee point)**
    - `p95` slope: `291 → 1095 (+804ms, +276%) → 1995 (+82%) → 7673 (+284%)`. The first steep rise is at **25 VUs** — this is the knee where queuing starts.
    - `RPS` slope: `9.1 → 20.4 (+124%) → 32.6 (+60%) → 32.4 (-0.6% flat)`. `RPS` grows to 50 VUs then **flatlines** at 100 VUs (`32.6 → 32.4`), indicating **throughput saturation between 50–100 VUs**. The knee for throughput is **50 VUs**.
    - Practical answer: **`Degradation starts at ~25 VUs` (latency), `saturation at ~50 VUs` (throughput)**. For a simple answer, use **`25 VUs` as degradation**.

3.  **No `http_req_failed` even at 100 VUs** (0% all runs) — server queues rather than rejects, so `error<1%` never becomes the limiter; `p95` is the limiter.

### 4.2 Updated DEV vs PROD context (overall 6-stage run still useful)

The earlier overall 6-stage run (`500 max VUs, 4m30s`) gave `DEV p95 22.9s / PROD p95 19.6s` and `RPS 17.1 vs 34.8`. Those overall numbers are **consistent** with the isolated table above: PROD at 50–100 VUs already has `p95 1.9–7.6s`, so mixing 200–500 VUs pulls the overall `p95` to ~20s. Use the **isolated table for precise SLO**, the **6-stage overall for DEV vs PROD comparison** (PROD ~2× throughput).

### 4.3 How to get even more precise (optional)

If you need to pinpoint between 10 and 25:

```bash
# Fine-grained between 10 and 25
k6 run --vus 15 --duration 30s scripts/mixed.js --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123! 2>&1 | Tee-Object results/mixed_v15.log
k6 run --vus 20 --duration 30s scripts/mixed.js --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123! 2>&1 | Tee-Object results/mixed_v20.log
```

**Other mitigations if you need higher capacity:**
- Increase `sleep(1)` → `sleep(2)` to lower per-VU RPS
- Seed more users / distribute `identity` to avoid `bcrypt` hotspot on single account
- Check `front/.env` `JWT_SECRET` / Supabase `service_role` — ensure no `500` fallback path (`route.ts:57`)

---

## 5. How to Reproduce

```bash
# Prereq
winget install k6
cat front/.env  # must have JWT_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Seed (once)
node e2e/k6/helpers/seed.mjs  # or manual register k6_loadtest@example.com / Password123!

# DEV
npm run dev --workspace=front
k6 run e2e/k6/scripts/mixed.js --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123!
# or: cd e2e/k6 && k6 run scripts/mixed.js

# PROD
npm run build --workspace=front && npm run start --workspace=front
k6 run e2e/k6/scripts/mixed.js --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123!
```

**Files to submit:** This `Report.md` + `results/mixed_summary_dev.json` + `results/mixed_summary_prod.json` (+ optional `results/mixed_raw_*.json` per-VU if you do §4).

---

## 6. References

- `e2e/k6/config.js:1` (BASE_URL, thresholds, stages)
- `front/app/api/auth/login/route.ts:6` (login bottleneck)
- `front/app/dashboard/page.tsx:19` (profile auth)
- `e2e/playwright.config.ts:29` (baseURL `http://localhost:3000`)
- k6 docs: `thresholds`, `stages`, `handleSummary`, `http_req_duration`, `http_req_failed`
