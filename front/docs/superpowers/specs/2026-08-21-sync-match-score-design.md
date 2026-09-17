# Design Document: Sync Match Score Calculation

## Overview
This design aligns the match score displayed on the student's **Applications** page (`/applications`) with the match score displayed on the **My Internships** page (`/dashboard/Internships`). Currently, the My Internships page calculates the score dynamically based on student skills and required internship skills, whereas the Applications page reads a random mock score (50%-95%) stored in the database.

To fix this:
1. We will implement a shared helper function `calculateMatchScoreHelper` to standardize the matching calculation.
2. We will update `applyToInternship` to save the actual calculated match score at application time.
3. We will update `getStudentApplications` to recalculate the match score dynamically on the fly based on current student skills, ensuring the Applications page is always in sync with My Internships.

---

## Architecture & Database Interaction

### 1. Database Schema Reference
- `public.applications`: Table storing applications. The `match_score` column will now store the calculated score.
- `public.student_skills`: Table containing student skills and proficiency levels.
- `public.internship_skills`: Table containing required skills and proficiency levels for internships.

### 2. Backend Changes

#### File: [lib/actions/internships.ts](file:///D:/In/internmatch/front/lib/actions/internships.ts)

##### A. Reusable Helper: `calculateMatchScoreHelper(studentSkills, internshipSkills)`
Calculates the level-scaled match score using a standardized algorithm:
- Maps `beginner`, `intermediate`, `advanced` to numerical weights `1`, `2`, `3`.
- Scales down matches if the student's skill level is below the required level.

##### B. Action: `applyToInternship(internshipId)`
- Query current student profile.
- Query student's skills (`student_skills`).
- Query internship's required skills (`internship_skills`).
- Calculate the actual match score using `calculateMatchScoreHelper`.
- Insert the new application row with the actual match score.

##### C. Action: `getStudentApplications()`
- Query current student profile.
- Query student's current skills (`student_skills`).
- Update select query to join `internship_skills` (within `internships`).
- Calculate match score dynamically for each application in the mapping loop using `calculateMatchScoreHelper`.

##### D. Action: `getStudentInternships()`
- Refactor to use `calculateMatchScoreHelper` instead of duplicate inline logic.

---

## Verification & Testing Plan
1. **Apply to new Internship**:
   - As a student, browse internships and apply to one.
   - Verify that the success message displays and the score matches the calculations based on student/internship skills.
   - Check the `applications` table to verify the correct computed score is saved.
2. **Applications page view**:
   - Go to `/applications`.
   - Verify that all applications show the exact match score calculated dynamically.
   - Modify the student's skills under Settings, reload both My Internships and Applications, and verify that the match scores on both pages change and remain identical.
