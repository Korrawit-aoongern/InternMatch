# Design Document: Company Internship Postings Management System

## Overview
This feature completes the internship posting and applicant management system for companies under `/dashboard/Internships`. It implements:
1. Full Next.js layout wrapping with `DashboardSidebar` and `DashboardHeader` for a consistent company dashboard experience.
2. A stats summary row (calculated dynamically from actual database postings and applications).
3. Complete CRUD/management features:
   - Create new internship postings.
   - Edit existing postings (including title, description, location, type, and status).
   - Search postings by title.
   - Filter postings by status: All, Active (`open`), Drafts (`draft`), and Closed (`closed`).
   - View the count of applicants for each internship posting.
   - View the detailed list of student applicants who applied to each posting, including their profile details and resume link.

---

## Database Schema Reference

### 1. `internships` Table
- `id` (uuid, primary key)
- `company_id` (uuid, foreign key to `companies.id`)
- `title` (varchar(255))
- `description` (text)
- `location` (varchar(255))
- `internship_type` (varchar(100)) - e.g., "Remote", "Hybrid", "On-site"
- `status` (varchar(20)) - `'open'`, `'draft'`, or `'closed'`
- `created_at` (timestamptz)

### 2. `applications` Table
- `id` (uuid, primary key)
- `student_id` (uuid, foreign key to `students.id`)
- `internship_id` (uuid, foreign key to `internships.id`)
- `match_score` (numeric)
- `status` (varchar(30)) - e.g., `'pending'`, `'accepted'`, `'rejected'`
- `applied_at` (timestamptz)

---

## Backend Changes

### 1. New File: `lib/actions/internships.ts`
This file will contain Server Actions to communicate with Supabase using the admin client.

#### A. Helper: `getCurrentCompanyId(supabase)`
Helper to authenticate user sessions, retrieve their role, check if they are a `"company"`, and return the company ID from the `companies` table.

#### B. Action: `getCompanyInternships()`
Queries all internships belonging to the authenticated company.
- Sub-query or count joining the `applications` table to determine the number of applicants for each posting.
- Returns list of internships with the format:
  ```typescript
  {
    id: string;
    title: string;
    description: string;
    location: string;
    internship_type: string;
    status: "open" | "draft" | "closed";
    created_at: string;
    applicant_count: number;
  }
  ```

#### C. Action: `createInternship(data)`
Validates input data (title, description, location, type, status) and inserts a new row into `internships`.

#### D. Action: `updateInternship(id, data)`
Updates an existing internship row by its ID, ensuring it belongs to the authenticated company.

#### E. Action: `getInternshipApplicants(internshipId)`
Retrieves the list of student applications for a specific internship:
- Joins `applications` with `students` and `users` (for email).
- Returns list of applicants with the format:
  ```typescript
  {
    application_id: string;
    student_id: string;
    fullname: string;
    university: string;
    faculty: string;
    major: string;
    study_year: number;
    profile_image: string;
    resume_url: string;
    email: string;
    match_score: number;
    status: string;
    applied_at: string;
  }
  ```

---

## Frontend Changes

### 2. Internships Page Redesign
File: [`app/dashboard/Internships/page.tsx`](file:///D:/internmatch/front/app/dashboard/Internships/page.tsx)

We will refactor this page into a fully-functional dashboard page:

#### A. Layout Integration
Wrap the entire JSX return with the Dashboard Sidebar and Header:
```tsx
<div className="bg-slate-50 text-slate-900 min-h-screen flex antialiased w-full">
  <DashboardSidebar />
  <main className="flex-1 flex flex-col min-w-0 md:ml-[260px] relative">
    <DashboardHeader title="My Internships" />
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Content */}
    </div>
  </main>
</div>
```

#### B. State Management
- `internships` (list of internships loaded from Server Action)
- `isLoading` (boolean)
- `searchQuery` (string, binds to the search input)
- `activeTab` (string: "All", "Active", "Drafts", "Closed")
- `isCreateOpen` (boolean, controls Create Modal)
- `isEditOpen` (boolean, controls Edit Modal)
- `selectedInternship` (object, current internship being edited or viewed)
- `isApplicantsOpen` (boolean, controls Applicants Modal)
- `applicants` (list of applicants loaded for the selected internship)
- `isLoadingApplicants` (boolean)

#### C. Modals implementation

##### Create / Edit Modal
Includes form fields:
- **Title**: text input (required)
- **Location**: text input (required)
- **Type**: select dropdown (Remote, Hybrid, On-site)
- **Status**: select dropdown (Active / `open`, Draft / `draft`, Closed / `closed`)
- **Description**: textarea (required)

##### View Applicants Modal
Displays:
- Internship Title at the top.
- List of applicants. Each entry shows:
  - Avatar, Full Name, University, Major, and Study Year.
  - Match Score badge (e.g., Green/Emerald badge with the percentage).
  - Applied Date.
  - Resume button (opens resume in new tab, disabled if not uploaded).
  - Empty state when no students have applied.

---

## Verification & Testing Plan
1. **Load Page**: Log in as a company user, visit `/dashboard/Internships`. Verify the page renders under the dashboard layout.
2. **Create Internship**: Click "Create New Internship", enter details, select "Active", and click submit. Verify it saves and appears in the list.
3. **Search & Filter**:
   - Type in the search input and verify cards are filtered by title.
   - Click "Active", "Drafts", or "Closed" tabs and verify filtering works.
4. **Edit Internship**: Click "Edit" on a card, modify fields (e.g., title, status to "Closed"), and save. Verify the changes are persisted.
5. **View Applicants**: Click "View (N)" on an active card. Verify the modal opens and displays the list of students with match scores and resume links.
