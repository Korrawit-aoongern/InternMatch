# Design Document: Level-Weighted Match Score Calculation

## Overview
This feature refines the skill matching algorithm. Instead of treating matches as binary (1 or 0), it scales down the match score contribution of a skill if the student has a lower level of proficiency than what the company requires (e.g. company requires `Advanced` but student has `Beginner`).

---

## Weighting Rules

Each required skill contributes to the overall match score. If a student possesses the skill, their contribution is calculated as follows:
- **Student Level >= Required Level**: `1.0` (Full Match)
- **Student Level < Required Level**: `Student Level / Required Level` (Scaled Match)
  - Required `Advanced` (3), Student has `Intermediate` (2): `2/3 = 0.67`
  - Required `Advanced` (3), Student has `Beginner` (1): `1/3 = 0.33`
  - Required `Intermediate` (2), Student has `Beginner` (1): `1/2 = 0.50`
- **Student does not possess the skill**: `0.0` (No Match)

---

## Backend Changes

### File: [lib/actions/internships.ts](file:///D:/In/internmatch/front/lib/actions/internships.ts)

#### `getStudentInternships()`
1. Fetch both `skill_id` and `level` from the `student_skills` table:
   ```typescript
   const { data: skillsData } = await supabase
     .from("student_skills")
     .select("skill_id, level")
     .eq("student_id", studentId);
   ```
2. Implement level mapping inside `getStudentInternships()`:
   ```typescript
   const levelMap: Record<string, number> = {
     "beginner": 1,
     "intermediate": 2,
     "advanced": 3
   };
   ```
3. Loop through `reqSkills` (internship required skills) and compute `matchScoreSum` using the ratio weight rule.
4. Set final `match_score = Math.round((matchScoreSum / requiredSkillsCount) * 100)`.

---

## Verification & Testing Plan
1. **Full match test**: Student has React (Advanced), Internship requires React (Advanced). Match score should be 100%.
2. **Intermediate vs Advanced test**: Student has React (Intermediate), Internship requires React (Advanced). Match score should be 67%.
3. **Beginner vs Advanced test**: Student has React (Beginner), Internship requires React (Advanced). Match score should be 33%.
4. **Beginner vs Intermediate test**: Student has React (Beginner), Internship requires React (Intermediate). Match score should be 50%.
5. **Level order check**: Verify that sorting descending places full matches higher than scaled down matching scores.
