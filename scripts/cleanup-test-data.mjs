import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../front/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function cleanup() {
  console.log('Starting cleanup for test data...');
  console.log('Supabase URL:', supabaseUrl);

  // 1. Delete test users - broad pattern for all test accounts
  // We will fetch and filter in JS to avoid complex ilike
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, email, username')
    .limit(10000);

  if (fetchError) {
    console.error('Fetch users error:', fetchError);
    return;
  }

  const testUserIds = [];
  const testPatterns = [
    'student_test_', 'dup_student', 'company_hr_', 'techcompany_', 'special_company',
    'login_student', 'space_student', 'logout_test', 'backbutton', 'pwd_', 'role_',
    'comp_edit', 'comp_empty', 'comp_links', 'm2_', 'm3_', 'm4', 'm5', 'm6', 'm7',
    'Intern', 'test_', '_test', 'example.com', 'tech.co.th'
  ];

  for (const u of users) {
    const email = (u.email || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const isTest = testPatterns.some(p => email.includes(p.toLowerCase()) || username.includes(p.toLowerCase())) 
      || email.endsWith('@example.com') 
      || (email.includes('tech.co.th') && (username.startsWith('m') || username.includes('test') || username.includes('company')));
    // Also check for timestamp-like usernames (contain numbers and test)
    const hasTimestamp = /\d{10,}/.test(username) || /\d{10,}/.test(email);
    if (isTest && hasTimestamp) {
      testUserIds.push(u.id);
    } else if (isTest && (email.includes('@example.com') || email.includes('tech.co.th'))) {
      // For safety, only delete if it looks like test data (has timestamp or test prefix)
      if (username.startsWith('m') || username.includes('test') || username.includes('student') || username.includes('company') || email.includes('test')) {
        testUserIds.push(u.id);
      }
    }
  }

  console.log(`Found ${testUserIds.length} test users to delete out of ${users.length} total`);

  // Also check internships
  const { data: internships, error: internError } = await supabase
    .from('internships')
    .select('id, title, company_id')
    .limit(10000);

  if (internError) {
    console.error('Fetch internships error:', internError);
  } else {
    console.log(`Found ${internships.length} total internships`);
    const testInternshipTitles = internships.filter(i => {
      const t = (i.title || '');
      return t.startsWith('Intern ') || t.startsWith('M3 ') || t.includes('W3-') || t.includes('W4-') || t.includes('W1-') || t.includes('Test') || t.includes('ตำแหน่ง');
    });
    console.log(`Found ${testInternshipTitles.length} test internships (by title)`);
  }

  if (testUserIds.length === 0) {
    console.log('No test users matched strict filter, trying broader...');
    // Broader: any user with @example.com and created in last 7 days? We don't have created_at, so just use email pattern
    const broadIds = users.filter(u => (u.email || '').toLowerCase().endsWith('@example.com') || (u.email || '').toLowerCase().includes('tech.co.th')).map(u => u.id);
    console.log(`Broad filter would delete ${broadIds.length} users - NOT deleting without explicit confirmation`);
    console.log('To delete, run with --force or adjust filter');
    // For now, only delete if we have explicit test pattern + timestamp
  }

  if (testUserIds.length > 0) {
    console.log(`Deleting ${testUserIds.length} test users...`);
    // Delete in batches of 100
    for (let i = 0; i < testUserIds.length; i += 100) {
      const batch = testUserIds.slice(i, i + 100);
      const { error, count } = await supabase.from('users').delete().in('id', batch);
      if (error) {
        console.error(`Batch ${i/100} delete error:`, error);
      } else {
        console.log(`Batch ${i/100} deleted`);
      }
    }
    console.log('User deletion complete - cascades to students/companies/applications via FK');
  }

  // Verify remaining
  const { data: remainingUsers } = await supabase.from('users').select('id').limit(5);
  console.log(`Remaining users sample: ${remainingUsers?.length}`);

  // Clean up storage buckets - list and delete test files
  const buckets = ['avatars', 'resumes'];
  for (const bucket of buckets) {
    try {
      const { data: files, error } = await supabase.storage.from(bucket).list('profile-images', { limit: 100 });
      if (!error && files) console.log(`Bucket ${bucket} profile-images: ${files.length} files`);
      const { data: files2 } = await supabase.storage.from(bucket).list('student-resumes', { limit: 100 });
      if (files2) console.log(`Bucket ${bucket} student-resumes: ${files2.length} files`);
      // For now, not deleting storage files automatically - they are small and expire
    } catch (e) {
      console.log(`Bucket ${bucket} check failed:`, e.message);
    }
  }

  console.log('Cleanup done!');
  console.log('Note: Internships for deleted users are removed via cascade. Orphaned internships with test titles but no user will be listed above.');
}

cleanup().catch(e => { console.error(e); process.exit(1); });
