# Sync Match Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize the match score calculation across My Internships and Applications views by introducing a shared helper function, calculating and saving the real match score upon applying, and calculating it dynamically when querying applications.

**Architecture:** Implement `calculateMatchScoreHelper` in `lib/actions/internships.ts`. Refactor `getStudentInternships`, `applyToInternship`, and `getStudentApplications` to utilize this helper.

**Tech Stack:** Next.js Server Actions, Supabase, JWT, TypeScript.

---

### Task 1: Add Reusable Match Score Helper and Refactor My Internships

**Files:**
- Modify: `lib/actions/internships.ts`

- [ ] **Step 1: Define `calculateMatchScoreHelper`**
  Add the following helper function at the top of the file (after imports but before `getCurrentCompanyId`):

  ```typescript
  function calculateMatchScoreHelper(studentSkills: any[], internshipSkills: any[]): number {
    const levelMap: Record<string, number> = {
      "beginner": 1,
      "intermediate": 2,
      "advanced": 3
    };

    const reqSkills = internshipSkills || [];
    const requiredSkillsCount = reqSkills.length;
    if (requiredSkillsCount === 0) return 100;

    let matchScoreSum = 0;

    reqSkills.forEach((is: any) => {
      const skillId = Number(is.skill_id);
      const requiredLevelStr = (is.level || "Intermediate").toLowerCase();
      const requiredLevel = levelMap[requiredLevelStr] || 2; // Default to Intermediate

      // Find if student has this skill
      const studentSkill = studentSkills.find((s: any) => Number(s.skill_id) === skillId);

      if (studentSkill) {
        const studentLevelStr = (studentSkill.level || "Intermediate").toLowerCase();
        const studentLevel = levelMap[studentLevelStr] || 2;

        if (studentLevel >= requiredLevel) {
          matchScoreSum += 1.0;
        } else {
          // Scale down the score contribution
          matchScoreSum += studentLevel / requiredLevel;
        }
      }
    });

    return Math.round((matchScoreSum / requiredSkillsCount) * 100);
  }
  ```

- [ ] **Step 2: Refactor `getStudentInternships` to use `calculateMatchScoreHelper`**
  Modify `getStudentInternships` (around line 490) to use the new helper function.
  Replace the inline calculation block:
  ```typescript
        // Calculate Match Score with Level Scaling
        const reqSkills = item.internship_skills || [];
        const requiredSkillsCount = reqSkills.length;
        let matchScoreSum = 0;
  
        reqSkills.forEach((is: any) => {
          const skillId = Number(is.skill_id);
          const requiredLevelStr = (is.level || "Intermediate").toLowerCase();
          const requiredLevel = levelMap[requiredLevelStr] || 2; // Default to Intermediate
  
          // Find if student has this skill
          const studentSkill = studentSkillsData.find((s: any) => Number(s.skill_id) === skillId);
  
          if (studentSkill) {
            const studentLevelStr = (studentSkill.level || "Intermediate").toLowerCase();
            const studentLevel = levelMap[studentLevelStr] || 2;
  
            if (studentLevel >= requiredLevel) {
              matchScoreSum += 1.0;
            } else {
              // Scale down the score contribution
              matchScoreSum += studentLevel / requiredLevel;
            }
          }
        });
  
        const matchScore = requiredSkillsCount > 0 
          ? Math.round((matchScoreSum / requiredSkillsCount) * 100) 
          : 100; // 100% if no skills are required
  ```
  with:
  ```typescript
        const matchScore = calculateMatchScoreHelper(studentSkillsData, item.internship_skills);
  ```

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add lib/actions/internships.ts
  git commit -m "refactor: extract calculateMatchScoreHelper and use in getStudentInternships"
  ```

---

### Task 2: Calculate and Store Actual Match Score in `applyToInternship`

**Files:**
- Modify: `lib/actions/internships.ts`

- [ ] **Step 1: Update `applyToInternship` to fetch student skills and internship skills**
  Modify `applyToInternship` (around lines 559-626) to query the database for student skills and required internship skills.
  Replace:
  ```typescript
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", decoded.userId)
        .maybeSingle();
  
      if (studentError || !student) {
        return { success: false, error: "Student profile not found" };
      }
  
      const { data: existingApp, error: checkError } = await supabase
        .from("applications")
        .select("id")
        .eq("student_id", student.id)
        .eq("internship_id", internshipId)
        .maybeSingle();
  
      if (existingApp) {
        return { success: false, error: "You have already applied to this internship" };
      }
  
      const mockMatchScore = Math.floor(Math.random() * (95 - 50 + 1)) + 50;
  
      const { data, error } = await supabase
        .from("applications")
        .insert([
          {
            student_id: student.id,
            internship_id: internshipId,
            match_score: mockMatchScore,
            status: "pending",
            applied_at: new Date().toISOString()
          }
        ])
  ```
  with:
  ```typescript
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", decoded.userId)
        .maybeSingle();
  
      if (studentError || !student) {
        return { success: false, error: "Student profile not found" };
      }
  
      const { data: existingApp, error: checkError } = await supabase
        .from("applications")
        .select("id")
        .eq("student_id", student.id)
        .eq("internship_id", internshipId)
        .maybeSingle();
  
      if (existingApp) {
        return { success: false, error: "You have already applied to this internship" };
      }

      // Fetch student skills
      const { data: studentSkills } = await supabase
        .from("student_skills")
        .select("skill_id, level")
        .eq("student_id", student.id);

      // Fetch internship required skills
      const { data: internshipSkills } = await supabase
        .from("internship_skills")
        .select("skill_id, level")
        .eq("internship_id", internshipId);

      const computedMatchScore = calculateMatchScoreHelper(studentSkills || [], internshipSkills || []);
  
      const { data, error } = await supabase
        .from("applications")
        .insert([
          {
            student_id: student.id,
            internship_id: internshipId,
            match_score: computedMatchScore,
            status: "pending",
            applied_at: new Date().toISOString()
          }
        ])
  ```

- [ ] **Step 2: Commit**
  Run:
  ```bash
  git add lib/actions/internships.ts
  git commit -m "feat: save actual computed match score in applyToInternship"
  ```

---

### Task 3: Recalculate Match Score Dynamically in `getStudentApplications`

**Files:**
- Modify: `lib/actions/internships.ts`

- [ ] **Step 1: Update `getStudentApplications` query and loop**
  Modify `getStudentApplications` (around lines 676-757) to select `internship_skills(skill_id, level)` and calculate the score dynamically.
  Replace:
  ```typescript
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          match_score,
          status,
          applied_at,
          internship_id,
          internships (
            title,
            company_id,
            description,
            responsibilities,
            location,
            internship_type,
            companies (
              company_name,
              logo,
              province
            )
          )
        `)
        .eq("student_id", student.id)
        .order("applied_at", { ascending: false });
  
      if (error) {
        console.error("Error fetching student applications:", error);
        return { success: false, error: error.message };
      }
  
      const mapped = (data || []).map((app: any) => ({
        id: app.id,
        match_score: app.match_score || 0,
        status: app.status || "pending",
        applied_at: app.applied_at || "",
        internship_id: app.internship_id,
        title: app.internships?.title || "Unknown Position",
        company_name: app.internships?.companies?.company_name || "Unknown Company",
        company_logo: app.internships?.companies?.logo || "",
        company_province: app.internships?.companies?.province || "",
        description: app.internships?.description || "",
        responsibilities: app.internships?.responsibilities || "",
        location: app.internships?.location || "",
        internship_type: app.internships?.internship_type || ""
      }));
  ```
  with:
  ```typescript
      // Fetch student skills for dynamic recalculation
      const { data: studentSkills } = await supabase
        .from("student_skills")
        .select("skill_id, level")
        .eq("student_id", student.id);

      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          match_score,
          status,
          applied_at,
          internship_id,
          internships (
            title,
            company_id,
            description,
            responsibilities,
            location,
            internship_type,
            companies (
              company_name,
              logo,
              province
            ),
            internship_skills (
              skill_id,
              level
            )
          )
        `)
        .eq("student_id", student.id)
        .order("applied_at", { ascending: false });
  
      if (error) {
        console.error("Error fetching student applications:", error);
        return { success: false, error: error.message };
      }
  
      const mapped = (data || []).map((app: any) => {
        const recalculatedScore = calculateMatchScoreHelper(
          studentSkills || [],
          app.internships?.internship_skills || []
        );

        return {
          id: app.id,
          match_score: recalculatedScore,
          status: app.status || "pending",
          applied_at: app.applied_at || "",
          internship_id: app.internship_id,
          title: app.internships?.title || "Unknown Position",
          company_name: app.internships?.companies?.company_name || "Unknown Company",
          company_logo: app.internships?.companies?.logo || "",
          company_province: app.internships?.companies?.province || "",
          description: app.internships?.description || "",
          responsibilities: app.internships?.responsibilities || "",
          location: app.internships?.location || "",
          internship_type: app.internships?.internship_type || ""
        };
      });
  ```

- [ ] **Step 2: Commit**
  Run:
  ```bash
  git add lib/actions/internships.ts
  git commit -m "feat: recalculate match score dynamically in getStudentApplications"
  ```
