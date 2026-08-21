# Student Skills Matching & Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calculate match scores between student skills and internship requirements, display percentages on cards, and sort descending by match score.

**Architecture:** Update `getStudentInternships` in `lib/actions/internships.ts` to fetch student skills, perform the math, and sort the list. Update UI card components in `app/dashboard/Internships/page.tsx` to color-code and display the matching percentage.

**Tech Stack:** Next.js (App Router), React 19, Supabase JS, TailwindCSS, Lucide Icons.

---

### Task 1: Update Server Action for Match Score Calculation & Sorting

**Files:**
- Modify: `lib/actions/internships.ts`

- [ ] **Step 1: Rewrite `getStudentInternships`**
Update `getStudentInternships` to calculate the matching percentage and sort descending:
```typescript
export async function getStudentInternships() {
  try {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    
    let studentId: string | null = null;
    let studentSkillIds: Set<number> = new Set();
    
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
            
            // Fetch student skills
            const { data: skillsData } = await supabase
              .from("student_skills")
              .select("skill_id")
              .eq("student_id", studentId);
              
            if (skillsData) {
              studentSkillIds = new Set(skillsData.map((s: any) => Number(s.skill_id)));
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

    const mappedInternships = (internships || []).map((item: any) => {
      const hasApplied = studentId 
        ? (item.applications || []).some((app: any) => app.student_id === studentId) 
        : false;
      
      const applicationStatus = studentId 
        ? (item.applications || []).find((app: any) => app.student_id === studentId)?.status || null 
        : null;

      // Calculate Match Score
      const reqSkills = item.internship_skills || [];
      const requiredSkillsCount = reqSkills.length;
      let matchedCount = 0;
      
      reqSkills.forEach((is: any) => {
        if (studentSkillIds.has(Number(is.skill_id))) {
          matchedCount++;
        }
      });

      const matchScore = requiredSkillsCount > 0 
        ? Math.round((matchedCount / requiredSkillsCount) * 100) 
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

- [ ] **Step 2: Commit server action updates**
```bash
git add lib/actions/internships.ts
git commit -m "feat: implement skill matching calculation and sorting in getStudentInternships"
```

---

### Task 2: Display Match Score Badge in Student UI

**Files:**
- Modify: `app/dashboard/Internships/page.tsx`

- [ ] **Step 3: Update `StudentInternshipCardItem` component**
Update `StudentInternshipCardItem` to accept and render `match_score` inside a color-coded badge on the top right:
```tsx
function StudentInternshipCardItem({
    item,
    onViewDetails,
    onApply,
    isApplying
}: {
    item: any;
    onViewDetails: () => void;
    onApply: () => void;
    isApplying: boolean;
}) {
    const { title, company_name, location, internship_type, has_applied, skills, match_score } = item;

    const getMatchScoreColor = (score: number) => {
        if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
        return "bg-slate-50 text-slate-600 border-slate-200";
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-blue-600">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
                        {internship_type}
                    </span>
                    <div className="flex items-center gap-2">
                        {has_applied && (
                            <span className="text-[10px] font-bold tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-md uppercase">
                                APPLIED
                            </span>
                        )}
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getMatchScoreColor(match_score)}`}>
                            {match_score}% Match
                        </span>
                    </div>
                </div>

                <div>
                    <h3 className="text-base font-bold text-slate-800 line-clamp-1">{title}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{company_name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {location}
                    </p>
                </div>

                {skills && skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {skills.map((skill: any) => (
                            <span
                                key={skill.skill_id}
                                className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200"
                            >
                                {skill.name} ({skill.level})
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                    onClick={onViewDetails}
                    className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2 px-3 rounded-xl transition-colors"
                >
                    View Details
                </button>
                {has_applied ? (
                    <button
                        disabled
                        className="bg-green-100 text-green-700 text-xs font-bold py-2 px-3 rounded-xl cursor-not-allowed opacity-90 text-center"
                    >
                        Applied
                    </button>
                ) : (
                    <button
                        onClick={onApply}
                        disabled={isApplying}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1"
                    >
                        {isApplying ? "Applying..." : "Apply Now"}
                    </button>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Update `StudentInternshipDetailsModal` component**
Include the Match Score badge next to form fields inside the modal:
```tsx
function StudentInternshipDetailsModal({
    item,
    onClose,
    onApply,
    isApplying
}: {
    item: any;
    onClose: () => void;
    onApply: () => void;
    isApplying: boolean;
}) {
    const { title, company_name, location, internship_type, description, responsibilities, skills, has_applied, match_score } = item;

    const getMatchScoreColor = (score: number) => {
        if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
        return "bg-slate-50 text-slate-600 border-slate-200";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-2xl space-y-4 shadow-xl border border-slate-100 max-h-[90vh] flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{company_name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2">
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
                            รูปแบบงาน: {internship_type}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            สถานที่: {location}
                        </span>
                        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${getMatchScoreColor(match_score)}`}>
                            {match_score}% Match
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">รายละเอียดงาน (Job Description)</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {description || "ไม่มีข้อมูลรายละเอียด"}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">หน้าที่ความรับผิดชอบ (Responsibilities)</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {responsibilities || "ไม่มีข้อมูลหน้าที่ความรับผิดชอบ"}
                        </p>
                    </div>

                    {skills && skills.length > 0 && (
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">ทักษะที่ต้องการ (Required Skills)</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {skills.map((skill: any) => (
                                    <span
                                        key={skill.skill_id}
                                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-600 border-blue-100"
                                    >
                                        {skill.name} ({skill.level})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-3 shrink-0 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">
                        ปิดหน้าต่าง
                    </button>
                    {has_applied ? (
                        <button
                            disabled
                            className="bg-green-100 text-green-700 text-sm font-semibold px-5 py-2 rounded-xl cursor-not-allowed"
                        >
                            Applied
                        </button>
                    ) : (
                        <button
                            onClick={onApply}
                            disabled={isApplying}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                            {isApplying ? "Applying..." : "Apply Now"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 5: Commit frontend UI changes**
```bash
git add app/dashboard/Internships/page.tsx
git commit -m "feat: display match score badges in student internships view cards and modals"
```

---

### Task 3: Verification and Build Check

**Files:**
- None (verification commands)

- [ ] **Step 6: Check TypeScript compiler compilation**
Run: `npx tsc --noEmit`
Expected: Passes without errors.

- [ ] **Step 7: Run build test to check Next.js build compilation**
Run: `npm run build`
Expected: Next.js build finishes successfully.
