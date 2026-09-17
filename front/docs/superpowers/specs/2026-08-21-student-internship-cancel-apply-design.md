# Design Document: Student Internship Application Cancellation

## Overview
This feature allows student users to cancel/withdraw their applications to internships directly from the `/dashboard/Internships` page. When an application is canceled, the corresponding row in the `applications` table is deleted, restoring the status of the internship posting to "Apply Now".

---

## Backend Changes

### File: [lib/actions/internships.ts](file:///D:/In/internmatch/front/lib/actions/internships.ts)

#### New Server Action: `cancelApplication(internshipId)`
1. Retrieve the student ID of the currently logged-in user.
2. Delete the record in the `applications` table matching both `student_id` and `internship_id`:
   ```typescript
   const { error } = await supabase
     .from("applications")
     .delete()
     .eq("student_id", student.id)
     .eq("internship_id", internshipId);
   ```
3. Return `{ success: true, message: "ยกเลิกการสมัครฝึกงานสำเร็จเรียบร้อย! 📥" }` or error message if it fails.

---

## Frontend Changes

### File: [app/dashboard/Internships/page.tsx](file:///D:/In/internmatch/front/app/dashboard/Internships/page.tsx)

#### 1. Page State & Handlers
- Add a new handler `handleCancelApply(internshipId)`:
  - Prompts a confirmation dialog.
  - Calls `cancelApplication(internshipId)`.
  - Alerts success and re-fetches internships to update UI state.
  - If details modal is open, updates modal `has_applied` status.

#### 2. Card UI (`StudentInternshipCardItem`)
- Replace the disabled "Applied" button with an active "Cancel Apply" button when `has_applied` is true:
  ```tsx
  {has_applied ? (
      <button
          onClick={onCancel}
          disabled={isCanceling}
          className="border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold py-2 px-3 rounded-xl transition-colors text-center"
      >
          {isCanceling ? "Canceling..." : "Cancel Apply"}
      </button>
  ) : (
      <button ...>Apply Now</button>
  )}
  ```

#### 3. Details Modal UI (`StudentInternshipDetailsModal`)
- Similarly, replace the disabled "Applied" button with an active "Cancel Apply" button in the footer actions when `has_applied` is true.

---

## Verification & Testing Plan
1. **Apply for Internship**: Click "Apply Now" on an internship card, verify it successfully registers and changes the card button to "Cancel Apply".
2. **Cancel Application**: Click "Cancel Apply" on the same card. Verify a confirmation dialog appears. After confirming, verify the action succeeds, alerts the user, and changes the button back to "Apply Now".
3. **Database Check**: Verify that when "Cancel Apply" is clicked and confirmed, the row containing the application is completely deleted from the `applications` table in the database.
