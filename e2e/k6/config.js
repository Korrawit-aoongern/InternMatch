// e2e/k6/config.js — shared thresholds & stages for all k6 scripts
// Usage in scripts: import { BASE_URL, thresholds, stages } from '../config.js';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Default thresholds per user request: p95 < 500ms, error < 1%
export const thresholds = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
};

// 6 stages: 10 -> 50 -> 100 -> 200 -> 300 -> 500 (total ~4m30s)
// หา Supported VUs (PASS) และ Degradation VUs (knee point)
export const stages = [
  { duration: '30s', target: 10 },  // Baseline
  { duration: '30s', target: 50 },  // Normal load
  { duration: '30s', target: 100 }, // Expected peak
  { duration: '60s', target: 200 }, // Stress
  { duration: '60s', target: 300 }, // Stress+
  { duration: '60s', target: 500 }, // Breakpoint search
];

// Seed account for login/profile tests — create once via helpers/seed.js or UI
export const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'k6_loadtest@example.com',
  username: __ENV.TEST_USER || 'k6_loadtest',
  password: __ENV.TEST_PASS || 'Password123!',
};
