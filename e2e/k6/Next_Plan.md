# Next_Plan: Stress Test — Match Score + AI Course Recommendations

**Context:** รอบแรก (`Plan.md` + `Report.md` + `report.html`) หา `Supported=10 VUs / Degradation=25 VUs (saturation 50)` บน `mixed` 3 endpoints (`GET /`, `POST /api/auth/login`, `GET /dashboard/profile`) เสร็จแล้ว  
**เป้าหมายรอบหน้า:** เทสระบบที่หนักจริง — **Match Score (`front/lib/utils/match.ts:12` `calculateMatchScoreHelper`)** + **AI หาคอร์ส (`front/lib/actions/geminiRecommendations.ts:49` `getAiSkillRecommendations`)** ซึ่ง `CPU + DB join + external Gemini API` หนักกว่า `login` (`bcrypt`) หลายเท่า

> ฐานโค้ด: `front/lib/actions/internships.ts:382` / `503` / `619` / `809` คำนวณ `match_score` ทุกครั้งที่ `getStudentInternships` / `apply` / `getApplicants` ; `front/components/matches/MatchesInternshipDetailsModal.tsx:104` เรียก `Gemini` แบบ background refinement

---

## 1. Scope & Endpoints (แยก 2 ระบบ)

| # | ระบบ | Code Path | k6 จะยิงอะไร | Note |
|---|------|-----------|--------------|------|
| A | **Match Score** | `front/lib/utils/match.ts:12` + `front/lib/actions/internships.ts:619` `getStudentInternships` | `GET /dashboard/internships` หรือ `GET /matches` (แล้วนับ `match_score%` ใน response) หรือ direct `server action` via `POST /` + `Supabase` join `internship_skills`/`student_skills` | Pure Node + DB join, ไม่มี external API, `threshold` ใช้ `p95<500ms` เดิมได้ |
| B | **AI Courses** | `front/lib/actions/geminiRecommendations.ts:49` → `https://generativelanguage.googleapis.com/v1beta/models/...:generateContent?key=` (`GEMINI_MODELS:32`) fallback `generateMockAiUpskilling` | `POST /api/ai/recommendations` หรือ `server action getAiSkillRecommendations` (เปิด modal `MatchesInternshipDetailsModal.tsx:105`) | External API, ต้อง `threshold` แยก `p95<2000ms` และคาด `rate limit` เร็ว |

**แนะนำ:** รัน **แยกไฟล์** `scripts/match.js` และ `scripts/ai_courses.js` ไม่รวมใน `mixed` เดิม — AI จะทำให้ `p95` เพี้ยนและโดน `429` บัง `DB` bottleneck

---

## 2. Test Data — เตรียมก่อน `k6 run`

- **Accounts:** `k6_loadtest@example.com` เดิม (`seed.mjs`) + เติม `student_skills` 5–10 ทักษะ (`intermediate/advanced` ปน) ใน `student_skills` (ใช้ `supabase` seed เพิ่ม) เพื่อให้ `match_score` คำนวณจริง (ไม่ใช่ `0` หรือ `100` อย่างเดียว)
- **Internships:** สร้าง 3–5 `internships` ที่มี `internship_skills` 3–8 ทักษะ + `level` คละ (`beginner/intermediate/advanced`) เพื่อให้ `calculateMatchScoreHelper` มี `gap` จริง (`utils/match.ts:38` `studentLevel / requiredLevel`)
- **AI:** เตรียม `internshipTitle` + `internshipSkills` ที่ `missingSkills` 2–3 ตัว → `geminiRecommendations.ts:62` จะได้ `hasGaps=true` และเรียก `Gemini` จริง (ไม่ return `100%` ที่ `line 89`)
- **GEMINI_API_KEY:** ต้องมีใน `front/.env:3` (`GEMINI_API_KEY=`) ไม่เช่นนั้นจะ `fallback` ไป `mock` (`line 102`) — ถ้าจะเทส `Gemini` จริง ต้องมี key และตั้ง `MOCK=false`

---

## 3. k6 Design — Next_Plan Scripts

```
e2e/k6/
  config.next.js         # thresholds แยกสำหรับ match vs ai
  scripts/
    match.js             # Stress: getStudentInternships
    ai_courses.js        # Stress: getAiSkillRecommendations
    ai_courses_mock.js   # เทียบ mock (no external call) vs real Gemini
  helpers/
    auth.js              # reuse login()
    seed.match.js        # seed internships + skills
  results/
    match_v*.log
    ai_v*.log
```

### 3.1 `config.next.js` (thresholds แยก)

```js
export const thresholdsMatch = { http_req_duration: ['p(95)<500'], http_req_failed: ['rate<0.01'] };
export const thresholdsAI   = { http_req_duration: ['p(95)<2000'], http_req_failed: ['rate<0.02'] }; // AI อนุโลมช้ากว่า + error 2% เพราะ external
export const stagesLight = [{duration:'30s', target:5}, {duration:'30s', target:10}, {duration:'30s', target:20}]; // AI ใช้ VUs ต่ำ
export const stagesMatch = [{duration:'30s', target:10}, {duration:'30s', target:25}, {duration:'30s', target:50}]; // Match ใช้ VUs สูงกว่า
```

### 3.2 `scripts/match.js` — ตัวอย่าง

```js
import http from 'k6/http'; import { check, sleep } from 'k6';
import { BASE_URL, TEST_USER } from '../config.js';
import { login } from '../helpers/auth.js';

export const options = { stages: [{duration:'30s',target:10},{duration:'30s',target:25},{duration:'30s',target:50}], thresholds: { 'http_req_duration': ['p(95)<500'] } };
let token;
export default function(){
  if(!token) token=http.cookieJar().get(BASE_URL,'auth_token')|| (token=login(BASE_URL,TEST_USER.email,TEST_USER.password));
  const jar=http.cookieJar(); jar.set(BASE_URL,'auth_token',token);
  const res=http.get(`${BASE_URL}/dashboard/internships`, {tags:{name:'GET /dashboard/internships'}});
  check(res, {'200': r=>r.status===200, 'has match_score': r=>r.body.includes('match_score')});
  sleep(2); // think time มากกว่า mixed (2s vs 1s) เพราะหน้าหนัก
}
```

### 3.3 `scripts/ai_courses.js` — ตัวอย่าง (ยิง Gemini)

```js
// POST to server action or API that calls getAiSkillRecommendations
const payload = JSON.stringify({ internshipTitle: "Frontend Intern", internshipSkills: [{skill_id:1, level:"Advanced", name:"React"}], studentSkills: [{skill_id:2, level:"Beginner", name:"Vue"}] });
const res=http.post(`${BASE_URL}/api/ai/recommendations`, payload, {headers:{'Content-Type':'application/json'}, tags:{name:'POST /api/ai/recommendations'}});
check(res, {'ai 200': r=>r.status===200, 'has recommendations': r=>{try{const j=r.json(); return j.recommendations?.length>0}catch{return false}}});
sleep(3); // AI call แพง — think time 3s
```

**Mock variant:** ถ้า `GEMINI_API_KEY` ไม่มี, `ai_courses_mock.js` จะวัดแค่ `generateMockAiUpskilling` (local) เทียบกับ `real` เพื่อแยกว่า `DB vs external` ใครช้าก่อน

---

## 4. Execution Steps (เหมือนรอบแรก แต่ VUs ต่ำลง)

```bash
# 1) เตรียม data
node e2e/k6/helpers/seed.match.js  # สร้าง internships + skills

# 2) Match Score (PROD, isolated)
k6 run --vus 10 --duration 30s e2e/k6/scripts/match.js --env BASE_URL=http://localhost:3000 --env TEST_EMAIL=k6_loadtest@example.com --env TEST_PASS=Password123! 2>&1 | Tee-Object results/match_v10.log
k6 run --vus 25 --duration 30s e2e/k6/scripts/match.js --env BASE_URL=http://localhost:3000  2>&1 | Tee-Object results/match_v25.log
k6 run --vus 50 --duration 30s e2e/k6/scripts/match.js  2>&1 | Tee-Object results/match_v50.log

# 3) AI Courses (VUs ต่ำกว่า, threshold 2s)
k6 run --vus 5  --duration 30s e2e/k6/scripts/ai_courses.js --env BASE_URL=http://localhost:3000 2>&1 | Tee-Object results/ai_v5.log
k6 run --vus 10 --duration 30s e2e/k6/scripts/ai_courses.js  2>&1 | Tee-Object results/ai_v10.log
k6 run --vus 20 --duration 30s e2e/k6/scripts/ai_courses.js  2>&1 | Tee-Object results/ai_v20.log
# 4) เทียบ mock
k6 run --vus 10 --duration 30s e2e/k6/scripts/ai_courses_mock.js 2>&1 | Tee-Object results/ai_mock_v10.log
```

**Thresholds:** `match: p95<500ms, error<1%` ; `ai: p95<2000ms, error<2%` (external)

---

## 5. Expected Results & What to Report

| Test | คาด Supported | คาด Degradation | ทำไม |
|------|---------------|-----------------|------|
| `match.js` | ~20–50 VUs | ~50 VUs | `calculateMatchScoreHelper` (`utils/match.ts:12`) เป็น pure loop + `Supabase` join `internship_skills`/`student_skills` — เร็วกว่า `bcrypt` แต่หนักกว่า `GET /` |
| `ai_courses.js` (real Gemini) | ~5 VUs | ~10 VUs | `geminiRecommendations.ts:155` loop `GEMINI_MODELS` 4 ตัว, `fetch` external, `temperature 0.4`, `429` เร็ว — `p95` จะพุ่งก่อน `DB` |
| `ai_courses_mock.js` | ~25 VUs | ~50 VUs | `generateMockAiUpskilling` local — เร็วกว่า real 5× |

**Report ที่จะได้:** `results/match_v*.log` + `ai_v*.log` → อัปเดต `Report.md` §ใหม่ + `report.html` เพิ่มกราฟ `Match vs AI (p95 + RPS)` — แยก `DB bottleneck` vs `external bottleneck`

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `GEMINI_API_KEY` ไม่มี → fallback mock ตลอด (`line 102`) | ตั้ง `MOCK` flag ชัดเจน, รายงานว่า `mock` ไม่ใช่ `real` |
| `Gemini 429` / quota หมด (`line 179`) | ใช้ `VUs 5–10`, `sleep(3)`, ทำ `mock` เทียบ, note ใน report |
| `Supabase` join หนัก (`internships.ts:619`) `select internships + companies + applications + internship_skills + skills` | สร้าง index `internship_skills(internship_id)`, `student_skills(student_id)` |
| `auth_token` หมดอายุระหว่าง `k6` | `login` ใน `setup` + `sleep(3)`, `rememberMe:false` (1d) พอ |
| `Next dev` ช้า | รัน `PROD` (`next build && next start`) เหมือนรอบแรก |

---

## 7. References

- `front/lib/utils/match.ts:12` `calculateMatchScoreHelper`
- `front/lib/actions/internships.ts:382` / `503` / `619` / `809` (recalculate `match_score`)
- `front/lib/actions/geminiRecommendations.ts:49` `getAiSkillRecommendations`, `line 32` `GEMINI_MODELS`, `line 155` fetch loop
- `front/components/matches/MatchesInternshipDetailsModal.tsx:104` background Gemini
- `front/.env.example:3` `GEMINI_API_KEY`
- `e2e/k6/config.js:1` (reuse `BASE_URL`, `TEST_USER`, `thresholds` pattern)
