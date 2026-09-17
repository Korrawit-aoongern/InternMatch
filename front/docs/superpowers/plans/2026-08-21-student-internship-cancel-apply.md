# Student Internship Application Cancellation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a student application cancellation action and UI flow so that student users can withdraw their applications from internship postings.

**Architecture:** Create a new `cancelApplication` server action in `lib/actions/internships.ts`. Update `app/dashboard/Internships/page.tsx` states, handlers, and card/modal subcomponents to render and process the cancellation action.

**Tech Stack:** Next.js (App Router), React 19, Supabase JS, TailwindCSS, Lucide Icons.

---

### Task 1: Create cancelApplication Server Action

**Files:**
- Modify: `lib/actions/internships.ts`

- [ ] **Step 1: Add `cancelApplication` server action**
Append the function to the end of `lib/actions/internships.ts`:
```typescript
export async function cancelApplication(internshipId: string) {
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
      return { success: false, error: "Unauthorized: Only students can cancel applications" };
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", decoded.userId)
      .maybeSingle();

    if (studentError || !student) {
      return { success: false, error: "Student profile not found" };
    }

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("student_id", student.id)
      .eq("internship_id", internshipId);

    if (error) {
      console.error("Error deleting application:", error);
      return { success: false, error: error.message };
    }

    return { success: true, message: "ยกเลิกการสมัครฝึกงานสำเร็จเรียบร้อย! 📥" };
  } catch (err: unknown) {
    console.error("Exception in cancelApplication:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel application",
    };
  }
}
```

- [ ] **Step 2: Commit server action updates**
```bash
git add lib/actions/internships.ts
git commit -m "feat: add cancelApplication server action"
```

---

### Task 2: Implement UI Cancellation Flow

**Files:**
- Modify: `app/dashboard/Internships/page.tsx`

- [ ] **Step 3: Import `cancelApplication` action**
Modify imports at the top of the file to include `cancelApplication` (around line 14):
```typescript
import {
    getCompanyInternships,
    createInternship,
    updateInternship,
    deleteInternship,
    getStudentInternships,
    applyToInternship,
    cancelApplication
} from "@/lib/actions/internships";
```

- [ ] **Step 4: Update `StudentInternshipsView` with `handleCancelApply` handler**
Inside `StudentInternshipsView` component, add `cancelingId` state and `handleCancelApply` handler:
```typescript
    const [cancelingId, setCancelingId] = useState<string | null>(null);

    const handleCancelApply = async (internshipId: string) => {
        if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการสมัครสำหรับตำแหน่งงานนี้?")) return;
        setCancelingId(internshipId);
        try {
            const res = await cancelApplication(internshipId);
            if (res.success) {
                alert("ยกเลิกการสมัครเสร็จสิ้นสำเร็จเรียบร้อย! 📥");
                fetchInternships();
                if (selectedInternship && selectedInternship.id === internshipId) {
                    setSelectedInternship((prev: any) => prev ? { ...prev, has_applied: false } : null);
                }
            } else {
                alert("เกิดข้อผิดพลาดในการยกเลิกสมัคร: " + res.error);
            }
        } catch (err) {
            console.error("Cancel apply error:", err);
        } finally {
            setCancelingId(null);
        }
    };
```

- [ ] **Step 5: Pass `onCancel` handler to components in JSX**
Update `StudentInternshipsView` render JSX to pass `onCancel` and `isCanceling` props to card and modal:
```tsx
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
                                onCancel={() => handleCancelApply(item.id)}
                                isCanceling={cancelingId === item.id}
                            />
                        ))}
                    </div>
```
And similarly for modal:
```tsx
                    {isDetailsOpen && selectedInternship && (
                        <StudentInternshipDetailsModal
                            item={selectedInternship}
                            onClose={() => {
                                setIsDetailsOpen(false);
                                setSelectedInternship(null);
                            }}
                            onApply={() => handleApply(selectedInternship.id)}
                            isApplying={applyingId === selectedInternship.id}
                            onCancel={() => handleCancelApply(selectedInternship.id)}
                            isCanceling={cancelingId === selectedInternship.id}
                        />
                    )}
```

- [ ] **Step 6: Update `StudentInternshipCardItem` component**
Update parameters to accept `onCancel: () => void` and `isCanceling: boolean`. Replace the disabled "Applied" button with the active "Cancel Apply" button:
```tsx
function StudentInternshipCardItem({
    item,
    onViewDetails,
    onApply,
    isApplying,
    onCancel,
    isCanceling
}: {
    item: any;
    onViewDetails: () => void;
    onApply: () => void;
    isApplying: boolean;
    onCancel: () => void;
    isCanceling: boolean;
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
                        onClick={onCancel}
                        disabled={isCanceling}
                        className="border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold py-2 px-3 rounded-xl transition-colors text-center disabled:opacity-50"
                    >
                        {isCanceling ? "Canceling..." : "Cancel Apply"}
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

- [ ] **Step 7: Update `StudentInternshipDetailsModal` component**
Similarly, update the modal footer section to support canceling the application:
```tsx
function StudentInternshipDetailsModal({
    item,
    onClose,
    onApply,
    isApplying,
    onCancel,
    isCanceling
}: {
    item: any;
    onClose: () => void;
    onApply: () => void;
    isApplying: boolean;
    onCancel: () => void;
    isCanceling: boolean;
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
                            onClick={onCancel}
                            disabled={isCanceling}
                            className="border border-rose-200 hover:bg-rose-50 text-rose-600 text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {isCanceling ? "Canceling..." : "Cancel Apply"}
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

- [ ] **Step 8: Commit UI implementation**
```bash
git add app/dashboard/Internships/page.tsx
git commit -m "feat: implement cancellation UI flow in student internships view"
```

---

### Task 3: Verification and Build Check

**Files:**
- None (verification commands)

- [ ] **Step 9: Check TypeScript compiler compilation**
Run: `npx tsc --noEmit`
Expected: Passes without errors.

- [ ] **Step 10: Run build test to check Next.js build compilation**
Run: `npm run build`
Expected: Next.js build finishes successfully.
