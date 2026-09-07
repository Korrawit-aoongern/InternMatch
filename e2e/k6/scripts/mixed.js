import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL, thresholds, stages, TEST_USER } from '../config.js';
import { login } from '../helpers/auth.js';

export const options = {
  stages: stages,
  thresholds: thresholds,
};

// Mixed workload: 40% home, 30% login, 30% profile
// This is the main report to send to professor —หา Supported vs Degradation VUs
let authToken = null;

export default function () {
  const r = Math.random();

  if (r < 0.4) {
    // 40% — GET /
    group('GET /', () => {
      const res = http.get(`${BASE_URL}/`, { tags: { name: 'GET /' } });
      check(res, {
        'home 200': (x) => x.status === 200,
      });
    });
  } else if (r < 0.7) {
    // 30% — POST /api/auth/login
    group('POST /api/auth/login', () => {
      const payload = JSON.stringify({
        identity: TEST_USER.email,
        password: TEST_USER.password,
        rememberMe: false,
      });
      const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'POST /api/auth/login' },
      });
      check(res, { 'login 200': (x) => x.status === 200 });
    });
  } else {
    // 30% — GET /dashboard/profile (auth)
    group('GET /dashboard/profile', () => {
      if (!authToken) {
        authToken = login(BASE_URL, TEST_USER.email, TEST_USER.password);
        if (!authToken) {
          console.warn(`mixed profile: login failed vu=${__VU}`);
          return;
        }
        sleep(0.3);
      }
      const jar = http.cookieJar();
      jar.set(BASE_URL, 'auth_token', authToken);
      const res = http.get(`${BASE_URL}/dashboard/profile`, {
        tags: { name: 'GET /dashboard/profile' },
      });
      check(res, {
        'profile 200|302': (x) => [200, 302, 307].includes(x.status),
      });
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  // Save raw JSON for later report generation
  return {
    'results/mixed_summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Minimal textSummary fallback if k6-summary not available
function textSummary(data, opts) {
  const d = data.metrics;
  const lines = [];
  lines.push('=== k6 mixed.js summary ===');
  if (d.http_req_duration) {
    const v = d.http_req_duration.values;
    lines.push(`http_req_duration: avg=${v.avg?.toFixed(1)}ms p95=${v['p(95)']?.toFixed(1)}ms max=${v.max?.toFixed(1)}ms`);
  }
  if (d.http_req_failed) lines.push(`http_req_failed: ${(d.http_req_failed.values.rate * 100).toFixed(2)}%`);
  if (d.http_reqs) lines.push(`http_reqs: ${d.http_reqs.values.count} total, ${d.http_reqs.values.rate?.toFixed(1)}/s`);
  if (d.checks) lines.push(`checks: ${(d.checks.values.passes / (d.checks.values.passes + d.checks.values.fails) * 100).toFixed(1)}% pass`);
  lines.push('');
  lines.push('Compare DEV vs PROD results in results/mixed_summary.json');
  lines.push('Thresholds: p(95)<500ms, error<1%, checks>99%');
  return lines.join('\n');
}
