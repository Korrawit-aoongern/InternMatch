# Design Document: Company Internships Multi-step Modal & Skills Integration

## Overview
This document specifies the design for Approach 1 (Multi-step Modal with Next/Back buttons) for the company internships management page under `/dashboard/Internships`. It implements:
1. **Multi-step Modal**: A 2-step wizard modal for creating and editing internship postings.
   - **Step 1: General Info (ข้อมูลทั่วไป)**: Form fields for position title, department, work type (internship_type), location, job description, and recruitment status (open/closed).
   - **Step 2: Required Skills (ทักษะที่ต้องการ)**: Category-based skills selector pulling real master skills data from `public.skills`. Users can search and select skills, and configure each selected skill's importance as "Required (จำเป็น)" or "Optional (แนะนำ/เสริม)".
2. **Server Actions Integration**: Updates to backend actions to persist both internship details (including the `department` column) and their associated skills in a single cohesive Server Action.

---

## Database Schema & Column Mapping

### 1. `public.internships` Table
We assume that a `department` column exists (or is added) in this table.
- `id` (uuid, primary key)
- `company_id` (uuid, foreign key)
- `title` (varchar)
- `department` (varchar) - **Added field**
- `description` (text)
- `location` (varchar)
- `internship_type` (varchar) - "Remote" | "Hybrid" | "On-site"
- `status` (varchar) - "open" | "closed" (strictly validated per CHECK constraint)
- `created_at` (timestamptz)

### 2. `public.internship_skills` Table
- `id` (bigserial, primary key)
- `internship_id` (uuid, foreign key)
- `skill_id` (bigint, foreign key to `public.skills`)
- `required` (boolean) - `true` for "Required", `false` for "Optional"

---

## Backend Changes (`lib/actions/internships.ts`)

1. **`InternshipInput` Interface**
   ```typescript
   export interface InternshipSkillInput {
     skill_id: number;
     required: boolean;
   }

   export interface InternshipInput {
     title: string;
     department: string;
     description: string;
     location: string;
     internship_type: string;
     status: "open" | "closed";
     skills?: InternshipSkillInput[];
   }
   ```

2. **`getCompanyInternships()`**
   Queries `internships` including the `department` column, joins `internship_skills` and `skills` to fetch the associated skills list, and maps `required` correctly.

3. **`createInternship(input: InternshipInput)`**
   Inserts the new internship (with `department`), retrieves the generated `id`, and inserts all mapped skills into `internship_skills` in the same server action.

4. **`updateInternship(id: string, input: Partial<InternshipInput>)`**
   Updates the internship row (including `department`), deletes any existing skills mapping in `internship_skills` for this internship ID, and inserts the updated list of skills.

---

## Frontend Changes (`app/dashboard/Internships/page.tsx`)

1. **Modal Form Wizard Flow**
   - Controlled by a state `step` (1 or 2).
   - **Step 1 View**:
     - Fields: Title, Department, Type (Hybrid/Remote/On-site), Location, Status (open/closed), Description.
     - Footer: "ยกเลิก (Cancel)" and "ถัดไป (Next)".
     - The "Next" button validates that required fields (Title, Location, Description) are filled out before proceeding to Step 2.
   - **Step 2 View**:
     - Displays skills list fetched from `getMasterSkills`.
     - Grouped by category headers.
     - Search input to filter the list.
     - Selectable skill badges.
     - **For selected skills**: A dropdown appears next to the skill name to toggle between:
       - `จำเป็น (Required)` -> Maps to `required: true` in payload.
       - `แนะนำ/เสริม (Optional)` -> Maps to `required: false` in payload.
     - Footer: "ย้อนกลับ (Back)" and "บันทึก (Save)".

2. **Displaying Skills Badges**
   - Render skills badges directly on each card:
     - **Required** skills: Blue theme badge (`bg-blue-50 text-blue-600 border-blue-200`).
     - **Optional** skills: Gray/slate theme badge (`bg-slate-50 text-slate-600 border-slate-200`).

---

## Verification & Testing Plan
1. **Wizard Stepper Navigation**: Verify Next button triggers Step 2 when Step 1 fields are valid, and Back button goes back to Step 1 preserving input.
2. **Form Persistence**: Submit form and confirm internship is successfully created in `internships` along with skills in `internship_skills`.
3. **Draft Removal**: Verify all status checks and selectors only offer `'open'` and `'closed'` statuses.
4. **Card Display**: Check that cards render the correct category/urgency level badges for skills.
