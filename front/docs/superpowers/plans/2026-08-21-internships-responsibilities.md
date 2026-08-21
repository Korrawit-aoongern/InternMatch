# Internship Responsibilities Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a required `responsibilities` field to the internship posting and editing flow for company users, ensuring it is stored in the database and validated appropriately on the frontend.

**Architecture:** Update server actions to handle the new `responsibilities` field in read, create, and update queries. Update the page state and multi-step modal form to collect, validate, and display the responsibilities field.

**Tech Stack:** Next.js (App Router), React 19, Supabase JS, TailwindCSS, Lucide Icons.

---

### Task 1: Update Server Actions for Internships

**Files:**
- Modify: `lib/actions/internships.ts`

- [ ] **Step 1: Update `InternshipInput` interface**
Modify the interface definition starting at line 29:
```typescript
export interface InternshipInput {
  title: string;
  department: string;
  description: string;
  responsibilities: string;
  location: string;
  internship_type: string;
  status: "open" | "closed";
  skills?: InternshipSkillInput[];
}
```

- [ ] **Step 2: Update `getCompanyInternships` returned mapping**
Add mapping for `responsibilities` under `mappedInternships` (around line 111):
```typescript
    const mappedInternships = (internships || []).map((item: any) => ({
      id: item.id,
      company_id: item.company_id,
      title: item.title,
      department: item.department || "",
      description: item.description,
      responsibilities: item.responsibilities || "",
      location: item.location,
      internship_type: item.internship_type,
      status: item.status as "open" | "closed",
      created_at: item.created_at,
      applicant_count: item.applications ? item.applications.length : 0,
      skills: (item.internship_skills || []).map((is: any) => ({
        id: is.id.toString(),
        skill_id: Number(is.skill_id),
        name: is.skills?.name || "Unknown",
        category: is.skills?.category || "Unknown",
        level: is.level || "Intermediate"
      }))
    }));
```

- [ ] **Step 3: Update `createInternship` database insert**
Pass `responsibilities` field inside `supabase.from("internships").insert(...)` (around line 143):
```typescript
    const { data, error } = await supabase
      .from("internships")
      .insert([
        {
          company_id: companyId,
          title: input.title.trim(),
          department: input.department.trim(),
          description: input.description.trim(),
          responsibilities: input.responsibilities.trim(),
          location: input.location.trim(),
          internship_type: input.internship_type,
          status: input.status,
        },
      ])
```

- [ ] **Step 4: Update `updateInternship` database update**
Pass `responsibilities` field in `updateData` conditional assignment (around line 204):
```typescript
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.department !== undefined) updateData.department = input.department.trim();
    if (input.description !== undefined) updateData.description = input.description.trim();
    if (input.responsibilities !== undefined) updateData.responsibilities = input.responsibilities.trim();
    if (input.location !== undefined) updateData.location = input.location.trim();
    if (input.internship_type !== undefined) updateData.internship_type = input.internship_type;
    if (input.status !== undefined) updateData.status = input.status;
```

- [ ] **Step 5: Commit server action updates**
```bash
git add lib/actions/internships.ts
git commit -m "feat: add responsibilities field to internships server actions"
```

---

### Task 2: Update Internships Management Page UI and Form Validation

**Files:**
- Modify: `app/dashboard/Internships/page.tsx`

- [ ] **Step 1: Update `Internship` interface**
Add `responsibilities?: string;` to `Internship` interface (around line 48):
```typescript
export interface Internship {
    id: string;
    company_id: string;
    title: string;
    department: string;
    location: string;
    internship_type: string;
    status: InternshipStatus;
    applicantsCount: number;
    postedDate: string;
    description?: string;
    responsibilities?: string;
    skills: InternshipSkill[];
}
```

- [ ] **Step 2: Update `formData` state default values**
Add `responsibilities: ""` to `formData` initialization (around line 89):
```typescript
    const [formData, setFormData] = useState({
        title: "",
        department: "",
        location: "",
        type: "Hybrid",
        status: "open" as InternshipStatus,
        description: "",
        responsibilities: "",
    });
```

- [ ] **Step 3: Update `responsibilities` mapping in `fetchInternships` and `loadInitialData`**
Modify mapping definitions in both functions (around line 121 and 154):
```typescript
                const mapped = res.internships.map((item) => ({
                    id: item.id,
                    company_id: item.company_id,
                    title: item.title,
                    department: item.department || "",
                    location: item.location || "",
                    internship_type: item.internship_type || "Hybrid",
                    status: item.status as InternshipStatus,
                    postedDate: item.created_at,
                    applicantsCount: item.applicant_count || 0,
                    skills: item.skills || [],
                    description: item.description || "",
                    responsibilities: item.responsibilities || ""
                }));
```

- [ ] **Step 4: Update `handleOpenCreateModal` and `handleOpenEditModal`**
Clear or populate `responsibilities` in form states:
```typescript
    const handleOpenCreateModal = () => {
        setEditingInternship(null);
        setFormData({
            title: "",
            department: "",
            location: "",
            type: "Hybrid",
            status: "open",
            description: "",
            responsibilities: "",
        });
        setSelectedSkills([]);
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: Internship) => {
        setEditingInternship(item);
        setFormData({
            title: item.title,
            department: item.department || "",
            location: item.location,
            type: item.internship_type || "Hybrid",
            status: item.status,
            description: item.description || "",
            responsibilities: item.responsibilities || "",
        });
        setSelectedSkills(item.skills.map(s => ({
            skill_id: s.skill_id,
            name: s.name,
            category: s.category,
            level: s.level || "Intermediate"
        })));
        setCurrentStep(1);
        setIsModalOpen(true);
    };
```

- [ ] **Step 5: Include `responsibilities` in `handleSaveInternship` action call**
Include `responsibilities: formData.responsibilities` in `updateInternship` and `createInternship` payloads (around line 303):
```typescript
        let res;
        if (editingInternship) {
            res = await updateInternship(editingInternship.id, {
                title: formData.title,
                department: formData.department,
                location: formData.location,
                internship_type: formData.type,
                status: formData.status,
                description: formData.description,
                responsibilities: formData.responsibilities,
                skills: skillsPayload
            });
        } else {
            res = await createInternship({
                title: formData.title,
                department: formData.department,
                location: formData.location,
                internship_type: formData.type,
                status: formData.status,
                description: formData.description,
                responsibilities: formData.responsibilities,
                skills: skillsPayload
            });
        }
```

- [ ] **Step 6: Update Step 1 to Step 2 transition validation check**
Add `formData.responsibilities` to the check in the "ถัดไป" button (around line 679):
```typescript
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formData.title && formData.location && formData.description && formData.department && formData.responsibilities) {
                                                            setCurrentStep(2);
                                                        } else {
                                                            alert("กรุณากรอกข้อมูลจำเป็นให้ครบถ้วนก่อนไปขั้นตอนถัดไป (*)");
                                                        }
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                                                >
                                                    ถัดไป
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
```

- [ ] **Step 7: Add UI fields in form JSX**
Add the `responsibilities` textarea field below description (around line 557):
```tsx
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                    หน้าที่ความรับผิดชอบ (Responsibilities) *
                                                </label>
                                                <textarea
                                                    rows={4}
                                                    required
                                                    value={formData.responsibilities}
                                                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                                                    placeholder="ระบุหน้าที่ความรับผิดชอบสำหรับตำแหน่งงานนี้..."
                                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
```

- [ ] **Step 8: Commit UI changes**
```bash
git add app/dashboard/Internships/page.tsx
git commit -m "feat: implement responsibilities UI field and form validation in internships page"
```

---

### Task 3: Verification and Build Check

**Files:**
- None (verification commands)

- [ ] **Step 1: Check TypeScript compiler compilation**
Run: `npx tsc --noEmit`
Expected: Passes without errors.

- [ ] **Step 2: Run build test to check Next.js build compilation**
Run: `npm run build`
Expected: Next.js build finishes successfully.
