# Design Document: Student Internships View

## Overview
This feature implements a student-facing "My Internships" view at `/dashboard/Internships` (which matches the sidebar link for both roles). It allows student users to search, browse, view details of, and apply to active internship postings created by company users.

---

## Architecture & Database Interaction

### 1. Database Schema Reference
- `public.internships`: Contains position listings.
- `public.companies`: Contains company profile information (joined to show company name, logo, location).
- `public.applications`: Contains student applications to internships. We check existence of a row matching current `student_id` and `internship_id` to determine application status.

### 2. Backend Changes

#### File: [lib/actions/internships.ts](file:///D:/In/internmatch/front/lib/actions/internships.ts)
We will add two new server actions:

##### A. `getStudentInternships()`
Queries all internships where `status = 'open'`:
- Joins `companies` to retrieve `company_name`, `logo`, and `province`.
- Joins `applications` to check if the current student has already applied.
- Joins `internship_skills` and `skills` to list required skills.
- Returns a list of mapped internships:
  ```typescript
  {
    id: string;
    company_name: string;
    company_logo: string;
    company_province: string;
    title: string;
    department: string;
    description: string;
    responsibilities: string;
    location: string;
    internship_type: string;
    status: string;
    created_at: string;
    has_applied: boolean;
    application_status: string | null;
    skills: { id: string; name: string; category: string; level: string }[];
  }
  ```

##### B. `applyToInternship(internshipId)`
Allows students to apply for an internship:
- Retrieves current student ID using logged-in user ID.
- Asserts that the user role is `'student'`.
- Checks if an application already exists for this student and internship.
- Generates a mock `match_score` (between 50% and 95%).
- Inserts a new application row in `applications` table with `status = 'pending'`.

---

## Frontend Changes

### 1. Sidebar Integration
File: [components/layout/DashboardSidebar.tsx](file:///D:/In/internmatch/front/components/layout/DashboardSidebar.tsx)
- Enable the "My Internships" link for student users in the sidebar:
  ```typescript
  ...(role === "student" || role === "company" ? [{ name: "My Internships", href: "/dashboard/Internships", icon: Briefcase }] : []),
  ```

### 2. Page Router Adjustments
File: [app/dashboard/Internships/page.tsx](file:///D:/In/internmatch/front/app/dashboard/Internships/page.tsx)
- Modify role authorization check to allow both `company` and `student` roles.
- Depending on the authenticated user's `role`, render the appropriate view subcomponent:
  - If `role === 'company'`: Render `CompanyInternshipsView` (retains the existing company CRUD page).
  - If `role === 'student'`: Render `StudentInternshipsView` (the new student browse & apply page).

### 3. Student view layout (`StudentInternshipsView`)
- **Search Bar**: Allows searching internships by title, department, company name, or location.
- **Internship Card**:
  - Company info (Name, Province, Logo/Icon placeholder).
  - Internship details (Title, Department, Location, Type).
  - Required Skills (list of skills badges with levels).
  - **Left Button**: "View Details" (Opens Details Modal).
  - **Right Button**: "Apply Now" (Triggers `applyToInternship`, changes status to "Applied" and disables itself once clicked).
- **Details Modal**:
  - Displays position title, company name, location, and type.
  - Lists Description (Job Description) and Responsibilities.
  - Lists Required Skills.
  - Shows "Apply Now" or "Applied" button inside the modal as well.

---

## Verification & Testing Plan
1. **Sidebar Link**: Log in as a student, verify "My Internships" is visible in the sidebar.
2. **Browse Internships**: Click "My Internships" as a student, verify all open internship postings are displayed.
3. **Search & Filter**: Type a company name or keyword, verify that only matching internships are shown.
4. **View Details**: Click "View Details" on an internship card, verify details modal opens with correct description and responsibilities.
5. **Apply Now**: Click "Apply Now" on a card. Verify the action completes successfully, displays a success message, and updates the button label to "Applied" (disabled). Verify in database that a row is added to the `applications` table.
