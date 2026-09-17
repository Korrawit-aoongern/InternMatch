# k6 Load Test — InternMatch

หา **Supported VUs** และ **Degradation VUs** บน `localhost` สำหรับ 3 endpoints:
`GET /`, `POST /api/auth/login`, `GET /dashboard/profile`

## Quick Start (DEV first, then PROD compare)

```bash
# 1) ติดตั้ง k6 (Windows)
winget install k6
k6 version

# 2) เตรียม front/.env (ต้องมี JWT_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
cat front/.env

# 3) Seed user (ครั้งเดียว) — ถ้า login ไม่ได้ ให้สร้าง manual ที่ /auth/register/student
node e2e/k6/helpers/seed.mjs
# หรือ manual: http://localhost:3000/auth/register/student
#   email=k6_loadtest@example.com username=k6_loadtest password=Password123!

# --- Round A: DEV ---
npm run dev --workspace=front
# รอ http://localhost:3000 พร้อม

k6 run e2e/k6/scripts/mixed.js --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123!
# เก็บผล: e2e/k6/results/mixed_summary.json

# --- Round B: PROD ---
# หยุด DEV (Ctrl+C)
npm run build --workspace=front
npm run start --workspace=front

k6 run e2e/k6/scripts/mixed.js --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123!
# เก็บผลเทียบ DEV vs PROD
```

## Scripts

| Script | Endpoint | Auth | ใช้ทำอะไร |
|--------|----------|------|-----------|
| `scripts/home.js` | `GET /` | no | วัด static/SSR ล้วน |
| `scripts/login.js` | `POST /api/auth/login` | no | วัด bcrypt + Supabase (คาดพังก่อน) |
| `scripts/profile.js` | `GET /dashboard/profile` | yes | วัด jwt.verify + Supabase join |
| `scripts/mixed.js` | 40/30/30 mix | mixed | **ตัวหลักส่งอาจารย์** — หา system breakpoint |

## Thresholds

`p(95) < 500ms`, `http_req_failed < 1%`, `checks > 99%`
Config อยู่ที่ `config.js` —แก้ `stages` ได้ตามต้องการ (default 6 stages: 10→50→100→200→300→500)

## Results

- Raw JSON: `results/*_summary.json` (via `handleSummary`)
- เพิ่ม `--out json=results/mixed_dev_6stages.json` ถ้าอยากได้ time-series JSON
- นำ `p95`, `RPS`, `error%` มาทำตาราง/กราฟ `VUs vs p95 vs RPS` ใน `Report.md`

## Troubleshooting

- `login 500` → เช็ค `front/.env` มี `JWT_SECRET` ไหม (`front/app/api/auth/login/route.ts:57`)
- `profile 302 → /auth/login` → `auth_token` ไม่ติด —เช็คว่า `login` สำเร็จก่อน
- `Supabase 429` → note ใน report ว่า bottleneck ที่ DB remote ไม่ใช่ Node
- `k6: command not found` → เปิด terminal ใหม่หลัง `winget install`
