# Student Internships View & Apply Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a student-facing internships browsing, searching, details viewing, and applying page at `/dashboard/Internships` using existing dashboard layout.

**Architecture:** Create new server actions `getStudentInternships` and `applyToInternship` in `lib/actions/internships.ts`. Refactor `app/dashboard/Internships/page.tsx` to conditionally render `StudentInternshipsView` or `CompanyInternshipsView` based on the user's role.

**Tech Stack:** Next.js (App Router), React 19, Supabase JS, TailwindCSS, Lucide Icons.

---

### Task 1: Create Student Server Actions for Internships

**Files:**
- Modify: `lib/actions/internships.ts`

- [ ] **Step 1: Implement `getStudentInternships` and `applyToInternship` server actions**
Append these functions to the end of the file:
```typescript
export async function getStudentInternships() {
  try {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    
    let studentId: string | null = null;
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
          if (student) studentId = student.id;
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
        skills: (item.internship_skills || []).map((is: any) => ({
          id: is.id.toString(),
          skill_id: Number(is.skill_id),
          name: is.skills?.name || "Unknown",
          category: is.skills?.category || "Unknown",
          level: is.level || "Intermediate"
        }))
      };
    });

    return { success: true, internships: mappedInternships };
  } catch (err: unknown) {
    console.error("Exception in getStudentInternships:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch internships for student",
    };
  }
}

export async function applyToInternship(internshipId: string) {
  try {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    if (!token) {
      return { success: false, error: "Unauthorized: No token found" };
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as any;

    if (decoded.role !== "student") {
      return { success: false, error: "Unauthorized: Only students can apply to internships" };
    }

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
      .select()
      .single();

    if (error) {
      console.error("Error creating application:", error);
      return { success: false, error: error.message };
    }

    return { success: true, application: data, message: "สมัครงานสำเร็จเรียบร้อย! 🎉" };
  } catch (err: unknown) {
    console.error("Exception in applyToInternship:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to apply to internship",
    };
  }
}
```

- [ ] **Step 2: Commit server action updates**
```bash
git add lib/actions/internships.ts
git commit -m "feat: add student server actions for fetching and applying to internships"
```

---

### Task 2: Enable Sidebar Link for Students

**Files:**
- Modify: `components/layout/DashboardSidebar.tsx`

- [ ] **Step 3: Modify `menuItems` filters**
Change the `menuItems` in `DashboardSidebar` (around line 36) to show "My Internships" to student roles as well:
```typescript
  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ...(role === "student" || role === "company" ? [{ name: "My Internships", href: "/dashboard/Internships", icon: Briefcase }] : []),
    ...(role === "student" || role === "company"
      ? [
          { name: "Applications", href: "/applications", icon: Briefcase },
          { name: "Matches", href: "/matches", icon: Brain },
        ]
      : []
    ),
    { name: "Settings", href: "/dashboard/profile", icon: Settings },
  ];
```

- [ ] **Step 4: Commit sidebar changes**
```bash
git add components/layout/DashboardSidebar.tsx
git commit -m "feat: enable My Internships sidebar link for student role"
```

---

### Task 3: Implement Page Conditional Rendering & Views

**Files:**
- Modify: `app/dashboard/Internships/page.tsx`

- [ ] **Step 5: Rename current `MyInternshipsPage` to `CompanyInternshipsView`**
Extract current states and logic into a subcomponent `CompanyInternshipsView()`.
Add new `StudentInternshipsView` subcomponent, along with helper subcomponents `StudentInternshipCardItem` and `StudentInternshipDetailsModal`.

- [ ] **Step 6: Update `MyInternshipsPage` router component**
Set `MyInternshipsPage` component to only determine role and render subcomponent:
```typescript
export default function MyInternshipsPage() {
    const [role, setRole] = useState<string | null>(null);
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkRole() {
            try {
                const res = await getUserRole();
                if (!res.success || (res.role !== "company" && res.role !== "student")) {
                    router.push("/dashboard");
                    return;
                }
                setRole(res.role);
                setIsCheckingRole(false);
            } catch (err) {
                console.error("Error checking role in Internships page:", err);
                router.push("/dashboard");
            }
        }
        checkRole();
    }, [router]);

    if (isCheckingRole) {
        return (
            <div className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center antialiased w-full">
                <div className="flex flex-col items-center justify-center">
                    <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                    <p className="text-sm font-semibold text-slate-500 mt-2">Checking access permissions...</p>
                </div>
            </div>
        );
    }

    if (role === "student") {
        return <StudentInternshipsView />;
    }

    return <CompanyInternshipsView />;
}
```

- [ ] **Step 7: Implement `StudentInternshipsView`**
Append the component code detailing search input, internships list grid rendering `StudentInternshipCardItem`s, and handling actions:
```tsx
function StudentInternshipsView() {
    const [internships, setInternships] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedInternship, setSelectedInternship] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [applyingId, setApplyingId] = useState<string | null>(null);

    const fetchInternships = async () => {
        setIsLoading(true);
        try {
            const res = await getStudentInternships();
            if (res.success && res.internships) {
                setInternships(res.internships);
            }
        } catch (err) {
            console.error("Failed to load student internships:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInternships();
    }, []);

    const handleApply = async (internshipId: string) => {
        if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการสมัครตำแหน่งงานนี้?")) return;
        setApplyingId(internshipId);
        try {
            const res = await applyToInternship(internshipId);
            if (res.success) {
                alert("สมัครตำแหน่งงานเสร็จสิ้นสำเร็จเรียบร้อย! 🎉");
                fetchInternships();
                if (selectedInternship && selectedInternship.id === internshipId) {
                    setSelectedInternship(prev => prev ? { ...prev, has_applied: true } : null);
                }
            } else {
                alert("เกิดข้อผิดพลาดในการสมัคร: " + res.error);
            }
        } catch (err) {
            console.error("Apply error:", err);
        } finally {
            setApplyingId(null);
        }
    };

    const filteredInternships = useMemo(() => {
        return internships.filter((item) => {
            if (searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(query);
                const matchCompany = item.company_name.toLowerCase().includes(query);
                const matchDept = item.department.toLowerCase().includes(query);
                const matchLocation = item.location.toLowerCase().includes(query);
                return matchTitle || matchCompany || matchDept || matchLocation;
            }
            return true;
        });
    }, [internships, searchQuery]);

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col md:flex-row antialiased w-full">
            <DashboardSidebar />
            <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen w-full">
                <DashboardHeader title="My Internships" />
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Internships</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                ค้นหาและยื่นใบสมัครรับเลือกเป็นนิสิตฝึกงานกับบริษัทชั้นนำ
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 w-full md:max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาตามตำแหน่ง, ฝ่าย หรือบริษัท..."
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm w-full"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center p-12">
                            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                        </div>
                    ) : filteredInternships.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-base font-semibold text-slate-700">ไม่พบประกาศรับสมัครฝึกงาน</p>
                            <p className="text-xs text-slate-400">ลองใช้คำค้นหาอื่นดูอีกครั้ง</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                            {filteredInternships.map((item) => (
                                <StudentInternshipCardItem
                                    key={item.id}
                                    item={item}
                                    onViewDetails={() => {
                                        setSelectedInternship(item);
                                        setIsDetailsOpen(true);
                                    }}
                                    onApply={() => handleApply(item.id)}
                                    isApplying={applyingId === item.id}
                                />
                            ))}
                        </div>
                    )}

                    {isDetailsOpen && selectedInternship && (
                        <StudentInternshipDetailsModal
                            item={selectedInternship}
                            onClose={() => {
                                setIsDetailsOpen(false);
                                setSelectedInternship(null);
                            }}
                            onApply={() => handleApply(selectedInternship.id)}
                            isApplying={applyingId === selectedInternship.id}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
```

- [ ] **Step 8: Implement `StudentInternshipCardItem` and `StudentInternshipDetailsModal` subcomponents**
Define the card renderer and modal details renderer:
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
    const { title, company_name, location, internship_type, has_applied, skills } = item;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-blue-600">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
                        {internship_type}
                    </span>
                    {has_applied && (
                        <span className="text-[10px] font-bold tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-md uppercase">
                            APPLIED
                        </span>
                    )}
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
                        className="bg-green-100 text-green-700 text-xs font-bold py-2 px-3 rounded-xl cursor-not-allowed opacity-90"
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
    const { title, company_name, location, internship_type, description, responsibilities, skills, has_applied } = item;

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

- [ ] **Step 9: Commit UI implementation**
```bash
git add app/dashboard/Internships/page.tsx
git commit -m "feat: implement student internships view subcomponents and layouts"
```

---

### Task 4: Verification and Build Check

**Files:**
- None (verification commands)

- [ ] **Step 10: Check TypeScript compiler compilation**
Run: `npx tsc --noEmit`
Expected: Passes without errors.

- [ ] **Step 2: Run build test to check Next.js build compilation**
Run: `npm run build`
Expected: Next.js build finishes successfully.
