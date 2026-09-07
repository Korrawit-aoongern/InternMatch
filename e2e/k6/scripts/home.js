import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, thresholds, stages } from '../config.js';

export const options = {
  stages: stages,
  thresholds: thresholds,
};

export default function () {
  const res = http.get(`${BASE_URL}/`, {
    tags: { name: 'GET /' },
  });

  check(res, {
    'home status 200': (r) => r.status === 200,
    'home body ok': (r) => r.body && r.body.length > 100,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'results/home_summary.json': JSON.stringify(data, null, 2),
  };
}
