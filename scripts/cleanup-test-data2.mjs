import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../front/.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchAllUsers() {
  let all = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from('users').select('id, email, username').range(from, from + step - 1).order('id');
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return all;
}

async function fetchAllInternships() {
  let all = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from('internships').select('id, title, company_id').range(from, from + step - 1).order('id');
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return all;
}

async function run() {
  const users = await fetchAllUsers();
  console.log('Total users:', users.length);
  const testUsers = users.filter(u => {
    const email = (u.email||'').toLowerCase();
    const username = (u.username||'').toLowerCase();
    const isTestEmail = email.endsWith('@example.com') || email.includes('tech.co.th') || email.includes('test');
    const isTestUser = username.startsWith('m') || username.includes('test') || username.includes('student') || username.includes('company') || username.includes('intern') || /\d{8,}/.test(username);
    // Keep demo and real users
    const isDemo = email.includes('internmatch.demo') || email === 'admin@gmail.com' || email === 'kinggod0104@gmail.com' || email.includes('hajime') || email.includes('korrawit') || email.includes('22580co');
    if (isDemo) return false;
    if (isTestEmail && isTestUser) return true;
    if (email.includes('test') || username.includes('test')) return true;
    if (/\d{10,}/.test(email) || /\d{10,}/.test(username)) return true;
    return false;
  });
  console.log('Test users to delete:', testUsers.length);
  testUsers.slice(0,10).forEach(u => console.log(' -', u.email, u.username));

  // Delete users in batches
  for (let i = 0; i < testUsers.length; i += 100) {
    const batch = testUsers.slice(i, i+100).map(u => u.id);
    const { error } = await supabase.from('users').delete().in('id', batch);
    if (error) console.error('delete error', error);
    else console.log(`Deleted batch ${i/100} (${batch.length})`);
  }

  const internships = await fetchAllInternships();
  console.log('Total internships:', internships.length);
  const testInternships = internships.filter(i => {
    const t = (i.title||'');
    return t.startsWith('Intern ') || t.startsWith('M3 ') || t.includes('W3-') || t.includes('W4-') || t.includes('W1-') || t === 'test' || t.includes('ตำแหน่ง');
  });
  console.log('Test internships to delete:', testInternships.length);
  testInternships.slice(0,10).forEach(i => console.log(' -', i.title));

  for (let i = 0; i < testInternships.length; i += 100) {
    const batch = testInternships.slice(i, i+100).map(x => x.id);
    const { error } = await supabase.from('internships').delete().in('id', batch);
    if (error) console.error('intern delete error', error);
    else console.log(`Deleted intern batch ${i/100}`);
  }

  // Verify
  const remainingUsers = await fetchAllUsers();
  console.log('Remaining users:', remainingUsers.length);
  const remainingInternships = await fetchAllInternships();
  console.log('Remaining internships:', remainingInternships.length);

  // Storage cleanup
  for (const bucket of ['avatars', 'resumes']) {
    for (const prefix of ['profile-images', 'student-resumes', '']) {
      try {
        const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 100 });
        if (error) continue;
        if (!data || data.length === 0) continue;
        console.log(`Bucket ${bucket}/${prefix}: ${data.length} files`);
        // Delete files older than 1 hour or with test pattern
        const toDelete = data.filter(f => f.name.includes('test') || f.name.includes('resume') || f.name.includes('avatar') || f.name.match(/\d{10,}/)).map(f => (prefix ? `${prefix}/${f.name}` : f.name));
        if (toDelete.length > 0) {
          console.log(` Deleting ${toDelete.length} files from ${bucket}/${prefix}`);
          const { error: delErr } = await supabase.storage.from(bucket).remove(toDelete);
          if (delErr) console.error(delErr);
        }
      } catch {}
    }
  }
  console.log('Done');
}
run().catch(console.error);
