import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, thresholds, stages, TEST_USER } from '../config.js';

export const options = {
  stages: stages,
  thresholds: thresholds,
};

export default function () {
  const payload = JSON.stringify({
    identity: TEST_USER.email,
    password: TEST_USER.password,
    rememberMe: false,
  });

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /api/auth/login' },
  });

  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
    'login success': (r) => {
      try {
        const j = r.json();
        return j.success === true;
      } catch (_) {
        return r.status === 200;
      }
    },
  });

  if (!ok) {
    // Help debugging: log first failure per VU occasionally
    if (Math.random() < 0.05) {
      console.warn(`login failed vu=${__VU} iter=${__ITER} status=${res.status} body=${res.body?.substring(0, 200)}`);
    }
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'results/login_summary.json': JSON.stringify(data, null, 2),
    stdout: `login: p95=${data.metrics.http_req_duration?.values['p(95)']?.toFixed(1)}ms RPS=${data.metrics.http_reqs?.values.rate?.toFixed(1)}/s failed=${(data.metrics.http_req_failed?.values.rate*100).toFixed(2)}%`,
  };
}
