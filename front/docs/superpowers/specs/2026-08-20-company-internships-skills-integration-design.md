# Design Document: Company Internships Supabase & Skills Integration

## Overview
This document details the integration of Supabase database persistence and skills management with the company internships posting system under `/dashboard/Internships`. It implements:
1. Connecting the client UI with real database states in `public.internships` and `public.internship_skills`.
2. Restricting the internship status to `'open'` (Active) and `'closed'` (Closed) per database constraints.
3. Implementing a Tab-based interface in the Create/Edit modal with two tabs:
   - **General Info (ข้อมูลทั่วไป)**: Form inputs for Title, Department, Location, Type, Status, and Description.
   - **Required Skills (ทักษะที่ต้องการ)**: Category-based skills selector similar to the Profile page, allowing multi-select toggle and configuring each selected skill as "Required (จำเป็น)" or "Optional (แนะนำ/เสริม)".
4. Updating Server Actions to retrieve, create, and update internship skills.
5. Displaying required/optional skills as badges on the Internship cards.

---

## Database Schema

### 1. `public.internships`
Stores the master internship posting data.
```sql
create table public.internships (
  id uuid not null default gen_random_uuid (),
  company_id uuid null,
  title character varying(255) not null,
  description text null,
  location character varying(255) null,
  internship_type character varying(100) null,
  status character varying(20) null default 'open'::character varying,
  created_at timestamp with time zone null default now(),
  constraint internships_pkey primary key (id),
  constraint internships_company_id_fkey foreign key (company_id) references companies (id) on delete cascade,
  constraint internships_status_check check (
    status::text = any (array['open'::character varying, 'closed'::character varying]::text[])
  )
) tablespace pg_default;
```

### 2. `public.internship_skills`
Maps internships to skills with a required/optional setting.
```sql
create table public.internship_skills (
  id bigserial not null,
  internship_id uuid null,
  skill_id bigint null,
  required boolean null default true,
  constraint internship_skills_pkey primary key (id),
  constraint internship_skills_internship_id_skill_id_key unique (internship_id, skill_id),
  constraint internship_skills_internship_id_fkey foreign key (internship_id) references internships (id) on delete cascade,
  constraint internship_skills_skill_id_fkey foreign key (skill_id) references skills (id)
) tablespace pg_default;
```

---

## Backend Changes (`lib/actions/internships.ts`)

1. **`getCompanyInternships()`**
   - Query internships joined with `internship_skills` and `skills` details.
   - Mapped return type:
     ```typescript
     export interface InternshipSkill {
       id: string;
       skill_id: number;
       name: string;
       category: string;
       required: boolean;
     }

     export interface InternshipOutput {
       id: string;
       company_id: string;
       title: string;
       description: string;
       location: string;
       internship_type: string;
       status: "open" | "closed";
       created_at: string;
       applicant_count: number;
       skills: InternshipSkill[];
     }
     ```

2. **`createInternship(input: InternshipInput)`**
   - Accept input with `skills?: { skill_id: number; required: boolean }[]`.
   - Insert internship row, then insert array of mapping rows in `internship_skills`.

3. **`updateInternship(id: string, input: Partial<InternshipInput>)`**
   - Accept updated fields and `skills?: { skill_id: number; required: boolean }[]`.
   - Update internship, then delete existing `internship_skills` for `internship_id = id` and insert new updated array of skills.

---

## Frontend Changes (`app/dashboard/Internships/page.tsx`)

1. **UI Layout & State**
   - Import `getCompanyInternships`, `createInternship`, `updateInternship`, `getInternshipApplicants` from `lib/actions/internships` and `getMasterSkills` from `lib/actions/skills`.
   - Remove mock list/local storage and use React states synced with Server Actions.
   - Restructure tabs filter on page: "All", "Active" (`open`), and "Closed" (`closed`). Remove "Drafts".

2. **Create/Edit Modal Updates**
   - Add a tab header selector in the modal: `General Info (ข้อมูลทั่วไป)` and `Skills Required (ทักษะที่ต้องการ)`.
   - **General Info tab**: Title, Department, Location, Type, Status (`open` / `closed`), and Description.
   - **Skills Required tab**:
     - Category-based list of all master skills (fetched via `getMasterSkills()`).
     - Search and filter input.
     - Toggle skills.
     - For selected skills, provide a dropdown selector to choose between "Required (จำเป็น)" or "Optional (แนะนำ/เสริม)".
     - Select indicator count per category and quick clear category buttons.

3. **Card Component Updates**
   - Render required/optional skills as colored badges on the cards (e.g., blue badges for Required, slate/gray badges for Optional).
   - Sync quick status toggle between `'open'` and `'closed'`.

---

## Verification & Testing Plan
1. **Database Schema Setup**: Verify SQL can be executed in Supabase SQL Editor.
2. **Page Loading**: Ensure page loads real data from `getCompanyInternships` Server Action.
3. **Creation with Skills**: Test creating a new internship posting, selecting general info and skills, saving, and verifying it exists in database tables.
4. **Editing with Skills**: Test modifying an existing posting, adding/removing skills, toggling "Required" status, saving, and verifying.
5. **Card Rendering**: Check if skills are displayed correctly on the internship lists cards.
