# Design Document: Student Skills Matching & Match Score Sorting

## Overview
This feature calculates the skill match percentage (Match Score) between a student's profile skills and the required skills of an internship posting. The Match Score is displayed on the top right corner of each internship card, and the internship postings are sorted in descending order (highest score first) on the student dashboard internships view.

---

## Backend Changes

### File: [lib/actions/internships.ts](file:///D:/In/internmatch/front/lib/actions/internships.ts)

#### `getStudentInternships()`
Update the action to calculate the Match Score for the authenticated student:
1. Retrieve the student's skills from the `student_skills` table using `student_id`:
   ```typescript
   const { data: studentSkills } = await supabase
     .from("student_skills")
     .select("skill_id")
     .eq("student_id", studentId);
   ```
2. Build a `Set` of the student's `skill_id`s.
3. For each internship:
   - Identify the list of required skills inside `internship_skills`.
   - Calculate matching count: how many of the internship's required skills are present in the student's skill set.
   - Match Score = `(matching count / required skills count) * 100`.
   - If the internship has no required skills, default the Match Score to `100` (since it matches all backgrounds).
4. Map `match_score` onto each returned internship object.
5. Sort the list of internships by `match_score` in descending order:
   ```typescript
   mappedInternships.sort((a, b) => b.match_score - a.match_score);
   ```

---

## Frontend Changes

### File: [app/dashboard/Internships/page.tsx](file:///D:/In/internmatch/front/app/dashboard/Internships/page.tsx)

#### 1. Interface Updates
- Update the `StudentInternshipCardItem` and `StudentInternshipDetailsModal` props to expect `match_score: number`.

#### 2. Card UI (`StudentInternshipCardItem`)
- Place a color-coded Match Score badge on the top right corner of the card:
  - Green / Emerald for Match Score >= 80%
  - Yellow / Amber for Match Score >= 50%
  - Gray / Slate for Match Score < 50%
- Example JSX placement in header:
  ```tsx
  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${getMatchScoreColor(match_score)}`}>
      {match_score}% Match
  </span>
  ```

#### 3. Details Modal UI (`StudentInternshipDetailsModal`)
- Add the Match Score badge next to the internship type and location badges in the modal header.

---

## Verification & Testing Plan
1. **No Skills Profile**: Log in as a student with no selected profile skills. Verify that all internships show match scores (100% for posts with no requirements, 0% for posts with requirements).
2. **Match Calculations**: Add some matching skills to the student profile. Reload the internships view. Verify the match percentage matches exactly `(matched / required) * 100`.
3. **Sorting**: Verify that internships with 100% or higher match scores are sorted at the top, and 0% or lower match scores are sorted at the bottom.
4. **Card UI Badge**: Verify the colors of the badges match the threshold criteria (Emerald for >=80%, Amber for >=50%, Gray for <50%).
