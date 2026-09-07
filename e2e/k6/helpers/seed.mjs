#!/usr/bin/env node
/**
 * helpers/seed.js — create k6 seed user once before running k6
 * Usage: node e2e/k6/helpers/seed.js
 * Requires: front/.env has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or valid API route
 *
 * This script tries to seed via direct Supabase insert if env is available,
 * otherwise instructs manual creation via UI.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontEnvPath = path.resolve(__dirname, '../../../front/.env');

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const content = fs.readFileSync(file, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv(frontEnvPath);
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'k6_loadtest@example.com';
const TEST_USER = process.env.TEST_USER || 'k6_loadtest';
const TEST_PASS = process.env.TEST_PASS || 'Password123!';

async function tryLogin() {
  console.log(`Checking if seed user exists via POST ${BASE_URL}/api/auth/login ...`);
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: TEST_EMAIL, password: TEST_PASS }),
  });
  console.log(`  login status: ${res.status}`);
  if (res.ok) {
    console.log('  Seed user already exists and login works — no need to seed.');
    return true;
  }
  const body = await res.text();
  console.log(`  body: ${body.substring(0, 300)}`);
  return false;
}

async function trySupabaseInsert() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    console.log('  Supabase env not found — skipping direct DB insert.');
    return false;
  }
  console.log(`  Attempting direct Supabase insert at ${url} ...`);
  // Minimal attempt: create via users table using Supabase REST
  // Note: password must be bcrypt hashed like front/lib/actions/auth.ts:68
  // We use plain bcrypt via Node if available
  let hashed = null;
  try {
    const bcrypt = await import('bcryptjs');
    hashed = await bcrypt.default.hash(TEST_PASS, 10);
  } catch (e) {
    console.log(`  bcryptjs not available: ${e.message} — cannot hash`);
    return false;
  }

  // Insert into users
  const userRes = await fetch(`${url}/rest/v1/users`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      email: TEST_EMAIL.toLowerCase(),
      username: TEST_USER,
      password: hashed,
      role: 'student',
    }),
  });
  console.log(`  users insert status: ${userRes.status}`);
  if (!userRes.ok) {
    const t = await userRes.text();
    console.log(`  users insert body: ${t.substring(0, 500)}`);
    if (t.includes('duplicate') || t.includes('already exists')) {
      console.log('  User likely already exists (duplicate).');
      return true;
    }
    return false;
  }
  const users = await userRes.json();
  const userId = users[0]?.id;
  console.log(`  created user id: ${userId}`);

  // Insert into students
  const stuRes = await fetch(`${url}/rest/v1/students`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      fullname: 'k6 Loadtest Student',
      phone: '0812345678',
      university: 'KMUTT',
      faculty: 'SIT',
      major: 'IT',
      study_year: 3,
    }),
  });
  console.log(`  students insert status: ${stuRes.status}`);
  if (!stuRes.ok) {
    console.log(`  students insert body: ${(await stuRes.text()).substring(0, 500)}`);
    return false;
  }
  console.log('  Seed success via Supabase.');
  return true;
}

async function main() {
  console.log('=== k6 Seed Helper ===');
  console.log(`BASE_URL=${BASE_URL}`);
  console.log(`TEST_EMAIL=${TEST_EMAIL} TEST_USER=${TEST_USER}`);

  // 1) Try login first — if ok, we're done
  try {
    if (await tryLogin()) return;
  } catch (e) {
    console.log(`  login check failed: ${e.message} (is front running on ${BASE_URL}?)`);
  }

  // 2) Try Supabase direct insert
  try {
    if (await trySupabaseInsert()) {
      // verify login again
      await tryLogin();
      return;
    }
  } catch (e) {
    console.log(`  supabase insert failed: ${e.message}`);
  }

  // 3) Manual fallback
  console.log('\n=== Manual step required ===');
  console.log('Could not auto-seed. Please create the seed user manually:');
  console.log('  1) Open http://localhost:3000/auth/register/student');
  console.log(`  2) Register: email=${TEST_EMAIL} username=${TEST_USER} password=${TEST_PASS}`);
  console.log('     fullname=k6 Loadtest, phone=0812345678, university=KMUTT, faculty=SIT, major=IT, year=3');
  console.log('  3) Re-run: node e2e/k6/helpers/seed.js');
}

main().catch(e => { console.error(e); process.exit(1); });
