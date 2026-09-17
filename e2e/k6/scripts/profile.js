import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, thresholds, stages, TEST_USER } from '../config.js';
import { login } from '../helpers/auth.js';

export const options = {
  stages: stages,
  thresholds: thresholds,
};

// Per-VU setup: login once and keep token in VU memory
let authToken = null;

export function setup() {
  // Note: setup runs once outside VU, but we also need per-VU login for cookie jar isolation.
  // So we do VU-level lazy login in default function.
  return {};
}

export default function () {
  // Lazy login per VU (first iteration)
  if (!authToken) {
    authToken = login(BASE_URL, TEST_USER.email, TEST_USER.password);
    if (!authToken) {
      console.warn(`profile: login failed vu=${__VU}, cannot test authenticated endpoint`);
      sleep(1);
      return;
    }
    // Small pause after login to avoid burst
    sleep(0.5);
  }

  // GET /dashboard/profile — server component checks auth_token cookie
  // Alternative: hit server action endpoint if page redirects; we check both 200 and 302
  const jar = http.cookieJar();
  jar.set(BASE_URL, 'auth_token', authToken);

  const res = http.get(`${BASE_URL}/dashboard/profile`, {
    tags: { name: 'GET /dashboard/profile' },
  });

  const ok = check(res, {
    'profile status 200 or 302': (r) => [200, 302, 307].includes(r.status),
    'profile has content': (r) => r.body && r.body.length > 100,
  });

  if (!ok && Math.random() < 0.05) {
    console.warn(`profile failed vu=${__VU} status=${res.status} body=${res.body?.substring(0, 200)}`);
  }

  // Also hit the server action's data layer indirectly via the page's RSC;
  // If profile page is heavy (Supabase join), this will surface latency.

  sleep(1);
}

export function handleSummary(data) {
  return {
    'results/profile_summary.json': JSON.stringify(data, null, 2),
    stdout: `profile: p95=${data.metrics.http_req_duration?.values['p(95)']?.toFixed(1)}ms RPS=${data.metrics.http_reqs?.values.rate?.toFixed(1)}/s`,
  };
}
