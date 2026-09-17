# Level-Weighted Match Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the match score calculation inside the `getStudentInternships` server action to scale down contributions based on skill level differences.

**Architecture:** Update `lib/actions/internships.ts` to map levels ("beginner" to 1, "intermediate" to 2, "advanced" to 3) and apply the ratio `studentLevel / requiredLevel` if the student has a lower level.

**Tech Stack:** Next.js (App Router), React 19, Supabase JS, TailwindCSS, Lucide Icons.

---

### Task 1: Update Server Action with Level-Weighted Math

**Files:**
- Modify: `lib/actions/internships.ts`

- [ ] **Step 1: Update getStudentInternships implementation**
Modify `getStudentInternships` to fetch `level` from `student_skills` and apply the ratio calculation logic:
```typescript
export async function getStudentInternships() {
  try {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    
    let studentId: string | null = null;
    let studentSkillsData: any[] = [];
    
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
        ) as any;
        
        if (decoded.role === "student") {
          const { data: student } = await supabase
            .from("students")
            .select("id")
            .eq("user_id", decoded.userId)
            .maybeSingle();
            
          if (student) {
            studentId = student.id;
            
            // Fetch student skills with level
            const { data: skillsData } = await supabase
              .from("student_skills")
              .select("skill_id, level")
              .eq("student_id", studentId);
              
            if (skillsData) {
              studentSkillsData = skillsData;
            }
          }
        }
      } catch (e) {
        console.error("Token verification failed in getStudentInternships:", e);
      }
    }

    const { data: internships, error } = await supabase
      .from("internships")
      .select(`
        *,
        companies (
          company_name,
          logo,
          province
        ),
        applications (
          id,
          student_id,
          status
        ),
        internship_skills (
          id,
          skill_id,
          level,
          skills (
            id,
            name,
            category
          )
        )
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching student internships:", error);
      return { success: false, error: error.message };
    }

    const levelMap: Record<string, number> = {
      "beginner": 1,
      "intermediate": 2,
      "advanced": 3
    };

    const mappedInternships = (internships || []).map((item: any) => {
      const hasApplied = studentId 
        ? (item.applications || []).some((app: any) => app.student_id === studentId) 
        : false;
      
      const applicationStatus = studentId 
        ? (item.applications || []).find((app: any) => app.student_id === studentId)?.status || null 
        : null;

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

      return {
        id: item.id,
        company_name: item.companies?.company_name || "Unknown Company",
        company_logo: item.companies?.logo || "",
        company_province: item.companies?.province || "",
        title: item.title,
        department: item.department || "",
        description: item.description,
        responsibilities: item.responsibilities || "",
        location: item.location,
        internship_type: item.internship_type,
        status: item.status,
        created_at: item.created_at,
        has_applied: hasApplied,
        application_status: applicationStatus,
        match_score: matchScore,
        skills: reqSkills.map((is: any) => ({
          id: is.id.toString(),
          skill_id: Number(is.skill_id),
          name: is.skills?.name || "Unknown",
          category: is.skills?.category || "Unknown",
          level: is.level || "Intermediate"
        }))
      };
    });

    // Sort by Match Score Descending
    mappedInternships.sort((a, b) => b.match_score - a.match_score);

    return { success: true, internships: mappedInternships };
  } catch (err: unknown) {
    console.error("Exception in getStudentInternships:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch internships for student",
    };
  }
}
```

- [ ] **Step 2: Commit backend math updates**
```bash
git add lib/actions/internships.ts
git commit -m "feat: implement level-weighted match score scaling logic"
```

---

### Task 2: Verification and Build Check

**Files:**
- None (verification commands)

- [ ] **Step 3: Check TypeScript compiler compilation**
Run: `npx tsc --noEmit`
Expected: Passes without errors.

- [ ] **Step 4: Run build test to check Next.js build compilation**
Run: `npm run build`
Expected: Next.js build finishes successfully.
