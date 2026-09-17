# Student Skills Display on Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fetch student skills and display them on internship cards and details modals, highlighting matching skills.

**Architecture:** Use `getStudentSkills` server action. Update `app/dashboard/Internships/page.tsx` states, handlers, and card/modal subcomponents to render student skills.

**Tech Stack:** Next.js (App Router), React 19, Supabase JS, TailwindCSS, Lucide Icons.

---

### Task 1: Update Internships Page to Load and Display Student Skills

**Files:**
- Modify: `app/dashboard/Internships/page.tsx`

- [ ] **Step 1: Import `getStudentSkills` server action**
Add import at the top of the file:
```typescript
import { getStudentSkills } from "@/lib/actions/skills";
```

- [ ] **Step 2: Add state and fetch student skills in `StudentInternshipsView`**
Add `studentSkills` state and fetch in `fetchInternships`:
```typescript
    const [studentSkills, setStudentSkills] = useState<any[]>([]);

    const fetchInternships = async () => {
        setIsLoading(true);
        try {
            const res = await getStudentInternships();
            if (res.success && res.internships) {
                setInternships(res.internships);
            }
            const skillsRes = await getStudentSkills();
            if (skillsRes.success && skillsRes.skills) {
                setStudentSkills(skillsRes.skills);
            }
        } catch (err) {
            console.error("Failed to load student internships or skills:", err);
        } finally {
            setIsLoading(false);
        }
    };
```

- [ ] **Step 3: Pass `studentSkills` to card and modal components in JSX**
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
                                studentSkills={studentSkills}
                            />
                        ))}
                    </div>
```
And for details modal:
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
                            studentSkills={studentSkills}
                        />
                    )}
```

- [ ] **Step 4: Update `StudentInternshipCardItem` component**
Accept `studentSkills` parameter and render "Your Skills" list:
```tsx
function StudentInternshipCardItem({
    item,
    onViewDetails,
    onApply,
    isApplying,
    onCancel,
    isCanceling,
    studentSkills
}: {
    item: any;
    onViewDetails: () => void;
    onApply: () => void;
    isApplying: boolean;
    onCancel: () => void;
    isCanceling: boolean;
    studentSkills: any[];
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
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ทักษะที่ต้องการ (Required Skills)</span>
                        <div className="flex flex-wrap gap-1.5">
                            {skills.map((skill: any) => (
                                <span
                                    key={skill.skill_id}
                                    className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200"
                                >
                                    {skill.name} ({skill.level})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {studentSkills && studentSkills.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-slate-100 mt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ทักษะของคุณ (Your Skills)</span>
                        <div className="flex flex-wrap gap-1.5">
                            {studentSkills.map((skill: any) => {
                                const isMatched = skills.some((req: any) => req.skill_id === skill.skill_id);
                                return (
                                    <span
                                        key={skill.skill_id}
                                        className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                            isMatched
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-slate-50 text-slate-500 border-slate-200"
                                        }`}
                                    >
                                        {isMatched && <span className="mr-1 text-[8px]">✓</span>}
                                        {skill.name}
                                    </span>
                                );
                            })}
                        </div>
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

- [ ] **Step 5: Update `StudentInternshipDetailsModal` component**
Accept `studentSkills` parameter and render "Your Skills" list in details modal:
```tsx
function StudentInternshipDetailsModal({
    item,
    onClose,
    onApply,
    isApplying,
    onCancel,
    isCanceling,
    studentSkills
}: {
    item: any;
    onClose: () => void;
    onApply: () => void;
    isApplying: boolean;
    onCancel: () => void;
    isCanceling: boolean;
    studentSkills: any[];
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

                    {studentSkills && studentSkills.length > 0 && (
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">ทักษะของคุณ (Your Skills)</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {studentSkills.map((skill: any) => {
                                    const isMatched = skills.some((req: any) => req.skill_id === skill.skill_id);
                                    return (
                                        <span
                                            key={skill.skill_id}
                                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                                                isMatched
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                            }`}
                                        >
                                            {isMatched && <span className="mr-1">✓</span>}
                                            {skill.name}
                                        </span>
                                    );
                                })}
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

- [ ] **Step 6: Commit UI changes**
```bash
git add app/dashboard/Internships/page.tsx
git commit -m "feat: show student profile skills on internship cards and modals"
```

---

### Task 2: Verification and Build Check

**Files:**
- None (verification commands)

- [ ] **Step 7: Check TypeScript compiler compilation**
Run: `npx tsc --noEmit`
Expected: Passes without errors.

- [ ] **Step 8: Run build test to check Next.js build compilation**
Run: `npm run build`
Expected: Next.js build finishes successfully.
