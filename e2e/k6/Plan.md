# Plan: k6 Load Test — หา VUs ที่ระบบรองรับได้ และ VUs ที่ทำให้ประสิทธิภาพลดลง

**Project:** InternMatch (`front` Next.js + `back` Express + Supabase)  
**Scope:** `localhost` (`http://localhost:3000`, ดู `e2e/playwright.config.ts:29`)  
**Endpoints:** 3 จุดที่อาจารย์ให้คิดเอง
1. `GET /` — หน้า Home (`front/app/page.tsx:13`, static/SSR, เบาที่สุด)
2. `POST /api/auth/login` — เข้าสู่ระบบ (`front/app/api/auth/login/route.ts:6`, `bcrypt.compare` + `Supabase SELECT users` + `jwt.sign` = bottleneck คาดการณ์)
3. `GET /dashboard/profile` — ต้องมี `auth_token` cookie (`front/app/dashboard/page.tsx:19`, `jwt.verify` + `Supabase students/companies`)

**Thresholds (ตกลงกัน):**
- `http_req_duration: p(95) < 500ms`
- `http_req_failed: rate < 0.01` (error < 1%)
- `checks: rate > 0.99`

> อ้างอิงโค้ด: `front/app/api/auth/login/route.ts:57-90` (ตั้ง `auth_token` cookie), `front/lib/actions/auth.ts:156` (อ่าน `auth_token`), `front/next.config.ts:6` (`bodySizeLimit 15mb`)

---

## 1. Objective — ตอบโจทย์อาจารย์ "run k6 6"

อาจารย์บอก "ให้แต่ละกลุ่ม หาจำนวน VUs Load Test ที่ระบบรองรับได้ และจำนวน VUs ที่เริ่มทำให้ประสิทธิภาพลดลง (run k6 6)" — ไม่มี spec ละเอียด เลยตีความว่า **ต้องรัน 6 ระดับ (6 stages)** เพื่อหา breakpoint ไม่ใช่รันครั้งเดียว

ต้องตอบ 2 ตัวเลข:
- **Supported VUs (Capacity):** VUs สูงสุดที่ thresholds ยัง PASS ทั้งหมด
- **Degradation VUs (Knee Point):** VUs ที่ `p95` เริ่มชันขึ้น >30% ต่อ step หรือ `RPS` เริ่ม flat/drop แม้ยังไม่ fail

"run k6 6" = `6 stages` แบบรันเดียวจบ: `10 → 50 → 100 → 200 → 300 → 500` (ถ้า 500 ยังไม่พัง ค่อยเพิ่ม 1000 อีกรอบ)

---

## 2. Architecture & Bottleneck Analysis

| Layer | Detail | ความเสี่ยงต่อ Load |
|-------|--------|-------------------|
| `front` Next.js dev (`front/package.json:6` `next dev`) | `next dev` ช้ากว่า `next start` (prod) 2-3x | p95 สูงเกินจริง ต้องรันเทียบ `build && start` รอบที่ 2 |
| `POST /api/auth/login` | `bcrypt.compare` (CPU-bound) + `Supabase` query + `jwt.sign` | คาดว่าจะพังก่อน `GET /` |
| `GET /dashboard/profile` | `jwt.verify` + `Supabase` join `students + users` (`front/lib/actions/auth.ts:168`) + `storage.createSignedUrl` ถ้ามี resume | Auth-bound, ต้องมี token |
| Supabase (remote) | DB + Storage อยู่บน cloud | อาจ rate limit ก่อนเครื่อง local — ต้อง note ใน report ว่า bottleneck ที่ DB ไม่ใช่ Node |
| `back/src/app.ts:5` | `Hello World` Express `:3003` | ไม่เกี่ยว — เทสที่ `front` |

---

## 3. Folder Structure (สร้างแล้ว)

```
e2e/k6/
  Plan.md              # ไฟล์นี้
  config.js            # BASE_URL, thresholds, stages
  helpers/
    auth.js            # login() -> auth_token
    seed.js            # สร้าง user ชั่วคราวสำหรับเทส
  scripts/
    home.js            # GET /
    login.js           # POST /api/auth/login
    profile.js         # GET /dashboard/profile (auth)
    mixed.js           # 40% home / 30% login / 30% profile (main report)
  results/
    .gitkeep
    mixed_6stages.json # --out json
    summary.html       # --out html หรือ k6-html-reporter
```

---

## 4. Test Design

### 4.1 Common Options (`config.js`)

```js
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const thresholds = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
};
export const stages = [
  { duration: '30s', target: 10 },   // Baseline
  { duration: '30s', target: 50 },   // Normal
  { duration: '30s', target: 100 },  // Expected peak
  { duration: '60s', target: 200 },  // Stress
  { duration: '60s', target: 300 },  // Stress+
  { duration: '60s', target: 500 },  // Breakpoint search
];
// รวม ~4m30s ต่อ run
```

### 4.2 Auth Helper (`helpers/auth.js`)

แก้ปัญหา "แล้วจะเอาไหนมาเข้าระบบ" (`front/lib/actions/auth.ts:156` ต้องมี `auth_token`):

```js
import http from 'k6/http';
import { check } from 'k6';

export function login(baseUrl, email, password) {
  const res = http.post(`${baseUrl}/api/auth/login`,
    JSON.stringify({ identity: email, password, rememberMe: false }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, { 'login 200': r => r.status === 200 });
  // front/app/api/auth/login/route.ts:90 -> response.cookies.set("auth_token", token)
  const jar = http.cookieJar();
  const cookies = jar.cookiesForURL(baseUrl);
  // หรือ parse res.cookies['auth_token'][0].value
  return res.cookies['auth_token'] ? res.cookies['auth_token'][0].value : null;
}
```

`setup()` จะ `POST /api/auth/login` ด้วย seed account หรือสร้างใหม่ผ่าน `POST /api/auth/register` (ต้องดู `front/lib/actions/auth.ts:62 registerUser`) เพื่อหลีกเลี่ยง `bcrypt` + `insert` มารบกวนตอนวัด

Seed account (แนะนำสร้างครั้งเดียวก่อนรัน k6):
```
email: k6_loadtest@example.com
username: k6_loadtest
password: Password123!
role: student
```
ถ้าไม่มี — `helpers/seed.js` จะ `fetch` สร้างให้ก่อน `k6 run`

### 4.3 Scripts

**`home.js` — GET /** (ไม่มี auth):
```js
import http from 'k6/http'; import { check } from 'k6';
export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, { 'home 200': r => r.status === 200, 'p95 <500': r => r.timings.duration < 500 });
}
```

**`login.js` — POST /api/auth/login**:
```js
const payload = JSON.stringify({ identity: __ENV.TEST_EMAIL, password: __ENV.TEST_PASS });
const res = http.post(`${BASE_URL}/api/auth/login`, payload, { headers: {'Content-Type':'application/json'} });
check(res, { 'login 200': r => r.status===200 });
```

**`profile.js` — GET /dashboard/profile** (ต้อง login ก่อน):
```js
export function setup() {
  const token = login(BASE_URL, __ENV.TEST_EMAIL, __ENV.TEST_PASS);
  return { token };
}
export default function (data) {
  const res = http.get(`${BASE_URL}/dashboard/profile`, {
    cookies: { auth_token: data.token }
  });
  check(res, { 'profile 200|302': r => [200,302].includes(r.status) });
}
```

**`mixed.js` — Main report (แนะนำเป็นตัวส่งอาจารย์)**:
- ใช้ `scenarios` หรือ `group` สุ่ม 40% home, 30% login, 30% profile เพื่อจำลอง user จริง

### 4.4 Single vs Mixed

- `mixed.js` (6 stages) = ตัวหลัก ส่งอาจารย์ (หา system-wide breakpoint)
- `home.js` / `login.js` / `profile.js` แยก = Appendix เพื่อบอกว่า endpoint ไหนพังก่อน (คาด `login` พังก่อน)

---

## 5. Execution Steps (localhost) — dev ก่อน แล้ว prod เทียบ

> ตามที่คุณ confirm: ไม่เปลี่ยน `playwright.config.ts` ถาวร — dev สำหรับซ้ำไว, prod สำหรับตัวเลขส่งอาจารย์

### Round A — DEV (baseline, สตาร์ตไว)

1. ติดตั้ง k6: `winget install k6` หรือ `choco install k6` -> `k6 version` ต้อง >=0.50
2. เตรียม `front/.env` (ต้องมี ไม่งั้น login 500 ที่ `route.ts:60`):
   ```
   JWT_SECRET=...
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. รัน frontend DEV: `npm run dev --workspace=front` (รอ `http://localhost:3000` พร้อม, `e2e/playwright.config.ts:72` ใช้ `reuseExistingServer`)
4. Seed user (ครั้งเดียว): `node e2e/k6/helpers/seed.mjs` หรือสมัคร manual ผ่าน UI `k6_loadtest@example.com / Password123!`
5. รัน main test (DEV):
   ```bash
   k6 run e2e/k6/scripts/mixed.js --out json=e2e/k6/results/mixed_dev_6stages.json --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123!
   ```
6. รันแยก endpoint (DEV, optional):
   ```bash
   k6 run e2e/k6/scripts/home.js --env BASE_URL=http://localhost:3000
   k6 run e2e/k6/scripts/login.js --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123!
   k6 run e2e/k6/scripts/profile.js --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123!
   ```

### Round B — PROD (build & start, ตัวเลขส่งอาจารย์)

7. หยุด DEV (`Ctrl+C`), แล้ว:
   ```bash
   npm run build --workspace=front
   npm run start --workspace=front
   # รอ http://localhost:3000 พร้อม (prod build ไม่มี HMR จะนิ่งกว่า)
   ```
8. รันซ้ำชุดเดิมบน PROD:
   ```bash
   k6 run e2e/k6/scripts/mixed.js --out json=e2e/k6/results/mixed_prod_6stages.json --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123!
   k6 run e2e/k6/scripts/home.js --out json=e2e/k6/results/home_prod.json --env BASE_URL=http://localhost:3000
   k6 run e2e/k6/scripts/login.js --out json=e2e/k6/results/login_prod.json --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123!
   k6 run e2e/k6/scripts/profile.js --out json=e2e/k6/results/profile_prod.json --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123!
   ```
9. เทียบผล DEV vs PROD ใน `e2e/k6/Report.md` — คาด `prod p95` ดีกว่า `dev` 2-3x, `Supported VUs` สูงกว่า

> **Note:** `back` (`:3003`) ไม่ต้องรัน — ทั้ง 3 endpoints อยู่ที่ `front` Next.js

---

## 6. Metrics to Collect & Report Format

ต่อ `stage` (VUs) เก็บ:
- `http_req_duration`: `avg, min, med, max, p(90), p(95)`
- `http_req_failed`: `rate`
- `http_reqs`: `count, rate (RPS)`
- `vus, vus_max, iteration_duration, checks`

**ตารางสรุปส่งอาจารย์:**

| VUs | p95 (ms) | avg (ms) | max (ms) | RPS | error% | Checks | Result |
|-----|----------|----------|----------|-----|--------|--------|--------|
| 10  | 120      | 80       | 250      | 45  | 0%     | 100%   | PASS |
| 50  | 180      | 110      | 400      | 210 | 0%     | 100%   | PASS |
| 100 | 340      | 200      | 800      | 380 | 0.2%   | 99.8%  | PASS (degrade start) |
| 200 | 620      | 400      | 1500     | 390 | 1.5%   | 98.5%  | FAIL |
| 300 | 1100     | 700      | 2500     | 380 | 4%     | 96%    | FAIL |
| 500 | 1800     | 1200     | 4000     | 350 | 8%     | 92%    | FAIL |

**กราฟ:** `VUs (x) vs p95 (y1) + RPS (y2)` — ดู `knee point` ที่ `p95` ชันขึ้นและ `RPS` flat

**สรุปตัวอย่าง:** `รองรับได้ ~100 VUs, เริ่ม degrade ที่ ~100-120 VUs` (ตัวเลขจริงต้องรันบนเครื่องคุณ)

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `Next dev` ช้าเกินจริง | รันเทียบ `next build && next start` |
| `bcrypt` กิน CPU | แยกวัด `login` ต่างหาก, ใช้ seed user เดิมไม่สร้างใหม่ทุก VU |
| Supabase rate limit | Note ใน report, ถ้าเจอ `429` ให้ถือว่า bottleneck ที่ DB |
| `auth_token` หมดอายุ | `setup()` login ใหม่ทุก run, ใช้ `rememberMe:false` (1d) ก็พอ |
| Port ชน | เช็ค `lsof -i :3000` ก่อนรัน |

---

## 8. Next Steps (หลัง Plan นี้)

- [x] เขียน `config.js`, `helpers/auth.js`, `helpers/seed.js`
- [x] เขียน `scripts/home.js`, `login.js`, `profile.js`, `mixed.js`
- [ ] `k6 run` ทั้ง 4 ไฟล์บน `localhost` DEV + เก็บ `results/mixed_dev_6stages.json`
- [ ] `npm run build && npm run start` แล้ว `k6 run` ซ้ำบน PROD + เก็บ `results/mixed_prod_6stages.json`
- [ ] Plot กราฟ DEV vs PROD + เขียน `e2e/k6/Report.md` สรุป 2 ตัวเลขส่งอาจารย์

---

## 9. References

- `e2e/playwright.config.ts:29` baseURL `http://localhost:3000`
- `front/app/api/auth/login/route.ts:6` POST login
- `front/app/dashboard/page.tsx:19` auth_token check
- `front/lib/actions/auth.ts:62` registerUser / `front/lib/actions/auth.ts:156` getStudentProfile
- `front/.env.example:1` env template
- `e2e/tests/Module-*.spec.ts` existing e2e flows (แปลงเป็น k6)
