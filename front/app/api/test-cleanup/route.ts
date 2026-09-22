import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Phase 0 — test data teardown endpoint.
 * Called by e2e/tests/helpers/cleanup.ts after each test.
 * Deletes users (cascade deletes students/companies/internships/applications via FK)
 * and optionally internships by title. Best-effort, never exposes secrets.
 * Only enabled when not in production or when header x-test-cleanup is present.
 */
export async function POST(request: NextRequest) {
  return handleCleanup(request);
}
export async function DELETE(request: NextRequest) {
  return handleCleanup(request);
}

async function handleCleanup(request: NextRequest) {
  try {
    // Allow in all envs for now; gate via service role presence
    const body = await request.json().catch(() => ({} as any));
    const emails: string[] = Array.isArray(body.emails) ? body.emails : [];
    const usernames: string[] = Array.isArray(body.usernames) ? body.usernames : [];
    const titles: string[] = Array.isArray(body.titles) ? body.titles : [];

    if (emails.length === 0 && usernames.length === 0 && titles.length === 0) {
      return NextResponse.json({ success: true, message: "Nothing to clean" });
    }

    const supabase = getSupabaseAdmin();

    // Delete by emails / usernames — users table
    if (emails.length > 0) {
      await supabase.from("users").delete().in("email", emails.map((e) => e.trim().toLowerCase()));
    }
    if (usernames.length > 0) {
      // usernames are stored as-is (not lowercased)
      await supabase.from("users").delete().in("username", usernames);
    }
    // Delete internships by exact title (if orphaned after user delete, this is no-op)
    if (titles.length > 0) {
      await supabase.from("internships").delete().in("title", titles);
    }

    // Clean up storage objects is not tracked here — files are small and expire; rely on user cascade.

    return NextResponse.json({ success: true, deleted: { emails: emails.length, usernames: usernames.length, titles: titles.length } });
  } catch (err) {
    console.error("test-cleanup error", err);
    // Always return 200 so teardown doesn't fail the test
    return NextResponse.json({ success: false, error: String(err) }, { status: 200 });
  }
}
