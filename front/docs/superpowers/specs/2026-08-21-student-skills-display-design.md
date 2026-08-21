# Design Document: Displaying Student Profile Skills on Internship Cards

## Overview
This feature displays the student's own profile skills on the student-facing internship cards and details modals. It highlights matching skills (skills the student has that match the internship's required skills) in green with a checkmark, and displays non-matching skills in standard gray. This will form the foundation for future AI recommendations (such as tutorial videos or courses) based on their skill sets.

---

## Frontend Changes

### File: [app/dashboard/Internships/page.tsx](file:///D:/In/internmatch/front/app/dashboard/Internships/page.tsx)

#### 1. Fetching Student Skills
- Import `getStudentSkills` from `@/lib/actions/skills`.
- Inside `StudentInternshipsView`, add state:
  ```typescript
  const [studentSkills, setStudentSkills] = useState<any[]>([]);
  ```
- Fetch the student's skills alongside internships in `fetchInternships()`:
  ```typescript
  const skillsRes = await getStudentSkills();
  if (skillsRes.success && skillsRes.skills) {
      setStudentSkills(skillsRes.skills);
  }
  ```

#### 2. Card Component Update (`StudentInternshipCardItem`)
- Pass `studentSkills` as a prop to `StudentInternshipCardItem`.
- Render a new section "ทักษะของคุณ (Your Skills)" beneath the required skills list:
  - If a skill is in the internship's required skills set, render it with green backgrounds (`bg-emerald-50 text-emerald-700`) and prepend a checkmark `✓`.
  - Otherwise, render it as a standard gray tag.

#### 3. Details Modal Component Update (`StudentInternshipDetailsModal`)
- Pass `studentSkills` as a prop to `StudentInternshipDetailsModal`.
- Display a similar matching list inside the modal's details body.

---

## Verification & Testing Plan
1. **No Skills Profile**: Verify that if a student has no skills on their profile, the "ทักษะของคุณ (Your Skills)" section is empty or does not render.
2. **Matching Highlighting**: Add some skills to the student's profile. Verify that the matching skills are rendered in green with a checkmark `✓` and non-matching skills are rendered in gray.
3. **Modal Verification**: Open the View Details modal and verify the skills section matches the card display.
