# Company Internships Supabase & Skills Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement database persistence and skills mapping for the company internship postings page under `/dashboard/Internships` using a Tab-based Create/Edit modal (General Info / Required Skills).

**Architecture:** Update Server Actions in `lib/actions/internships.ts` to support querying and mutating `internship_skills`. Update `app/dashboard/Internships/page.tsx` client component to retrieve data from Server Actions and implement a beautiful Tab-based interface for info and skills management.

**Tech Stack:** Next.js (App Router), React 19, Supabase JS, TailwindCSS, Lucide Icons.

---

### Task 1: Update Backend Server Actions

**Files:**
- Modify: `lib/actions/internships.ts`

- [ ] **Step 1: Update type definitions and imports**
Modify `lib/actions/internships.ts` to include `InternshipSkill` and update `InternshipInput` interface to accept skills array:

```typescript
export interface InternshipSkill {
  id: string;
  skill_id: number;
  name: string;
  category: string;
  required: boolean;
}

export interface InternshipInput {
  title: string;
  description: string;
  location: string;
  internship_type: string;
  status: "open" | "closed";
  skills?: { skill_id: number; required: boolean }[];
}
```

- [ ] **Step 2: Update getCompanyInternships to fetch skills**
Modify `getCompanyInternships` to join `internship_skills` and `skills` table, and map it to output structure:

```typescript
export async function getCompanyInternships() {
  try {
    const supabase = getSupabaseAdmin();
    const companyId = await getCurrentCompanyId(supabase);

    const { data: internships, error } = await supabase
      .from("internships")
      .select(`
        *,
        applications (
          id
        ),
        internship_skills (
          id,
          skill_id,
          required,
          skills (
            id,
            name,
            category
          )
        )
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching company internships:", error);
      return { success: false, error: error.message };
    }

    const mappedInternships = (internships || []).map((item: any) => ({
      id: item.id,
      company_id: item.company_id,
      title: item.title,
      description: item.description,
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
        required: is.required !== false
      }))
    }));

    return { success: true, internships: mappedInternships };
  } catch (err: unknown) {
    console.error("Exception in getCompanyInternships:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch internships",
    };
  }
}
```

- [ ] **Step 3: Update createInternship to insert skills**
Modify `createInternship` to insert both the internship row and matching `internship_skills` mapping records:

```typescript
export async function createInternship(input: InternshipInput) {
  try {
    const supabase = getSupabaseAdmin();
    const companyId = await getCurrentCompanyId(supabase);

    const { data, error } = await supabase
      .from("internships")
      .insert([
        {
          company_id: companyId,
          title: input.title.trim(),
          description: input.description.trim(),
          location: input.location.trim(),
          internship_type: input.internship_type,
          status: input.status,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating internship:", error);
      return { success: false, error: error.message };
    }

    // Insert associated skills if provided
    if (input.skills && input.skills.length > 0) {
      const skillInserts = input.skills.map(s => ({
        internship_id: data.id,
        skill_id: s.skill_id,
        required: s.required
      }));
      const { error: skillError } = await supabase
        .from("internship_skills")
        .insert(skillInserts);

      if (skillError) {
        console.error("Error inserting internship skills:", skillError);
        // Continue but warn or return partial success if needed
      }
    }

    return { success: true, internship: data, message: "สร้างประกาศรับสมัครงานสำเร็จเรียบร้อย! 🎉" };
  } catch (err: unknown) {
    console.error("Exception in createInternship:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create internship",
    };
  }
}
```

- [ ] **Step 4: Update updateInternship to overwrite skills**
Modify `updateInternship` to update the internship details and reset/insert `internship_skills`:

```typescript
export async function updateInternship(id: string, input: Partial<InternshipInput>) {
  try {
    const supabase = getSupabaseAdmin();
    const companyId = await getCurrentCompanyId(supabase);

    // Verify ownership before updating
    const { data: existing, error: findError } = await supabase
      .from("internships")
      .select("id")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (findError || !existing) {
      return { success: false, error: "Internship posting not found or unauthorized access" };
    }

    const { data, error } = await supabase
      .from("internships")
      .update({
        title: input.title?.trim(),
        description: input.description?.trim(),
        location: input.location?.trim(),
        internship_type: input.internship_type,
        status: input.status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating internship:", error);
      return { success: false, error: error.message };
    }

    // Update associated skills if provided
    if (input.skills !== undefined) {
      // 1. Delete existing skills
      const { error: deleteError } = await supabase
        .from("internship_skills")
        .delete()
        .eq("internship_id", id);

      if (deleteError) {
        console.error("Error deleting old internship skills:", deleteError);
      }

      // 2. Insert new skills
      if (input.skills.length > 0) {
        const skillInserts = input.skills.map(s => ({
          internship_id: id,
          skill_id: s.skill_id,
          required: s.required
        }));
        const { error: skillError } = await supabase
          .from("internship_skills")
          .insert(skillInserts);

        if (skillError) {
          console.error("Error inserting updated internship skills:", skillError);
        }
      }
    }

    return { success: true, internship: data, message: "อัปเดตรายละเอียดประกาศสำเร็จเรียบร้อย! 🎉" };
  } catch (err: unknown) {
    console.error("Exception in updateInternship:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update internship",
    };
  }
}
```

- [ ] **Step 5: Run tests and type checks**
Run: `npx tsc --noEmit`
Expected: Passes with no errors.

- [ ] **Step 6: Commit server action updates**
```bash
git add lib/actions/internships.ts
git commit -m "feat: update server actions to persist internship skills mapping"
```

---

### Task 2: Refactor UI, Integration & Tab-based Modal

**Files:**
- Modify: `app/dashboard/Internships/page.tsx`

- [ ] **Step 1: Import Server Actions and add typescript interfaces**
Update imports to bring in the newly defined Actions and `getMasterSkills`. Update types to support `'open'` and `'closed'` statuses:

```typescript
import { 
  getCompanyInternships, 
  createInternship, 
  updateInternship, 
  getInternshipApplicants 
} from "@/lib/actions/internships";
import { getMasterSkills } from "@/lib/actions/skills";

export type InternshipStatus = "open" | "closed";

export interface InternshipSkill {
  id: string;
  skill_id: number;
  name: string;
  category: string;
  required: boolean;
}

export interface Internship {
  id: string;
  company_id: string;
  title: string;
  description: string;
  location: string;
  internship_type: string;
  status: InternshipStatus;
  postedDate: string;
  applicantsCount: number;
  skills: InternshipSkill[];
}
```

- [ ] **Step 2: Sync main page states with Database**
In `MyInternshipsPage` component, initialize page loading states and fetch internships dynamically:

```typescript
export default function MyInternshipsPage() {
    const [internships, setInternships] = useState<Internship[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<string>("All");
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const router = useRouter();

    const fetchInternships = async () => {
        setIsLoading(true);
        try {
            const res = await getCompanyInternships();
            if (res.success && res.internships) {
                // Map fields to match UI conventions
                const mapped = res.internships.map((item: any) => ({
                    id: item.id,
                    company_id: item.company_id,
                    title: item.title,
                    description: item.description || "",
                    location: item.location || "",
                    internship_type: item.internship_type || "Hybrid",
                    status: item.status as InternshipStatus,
                    postedDate: item.created_at,
                    applicantsCount: item.applicant_count || 0,
                    skills: item.skills || []
                }));
                setInternships(mapped);
            }
        } catch (err) {
            console.error("Failed to load internships:", err);
        } finally {
            setIsLoading(false);
        }
    };
```

- [ ] **Step 3: Setup modal state including tabs and master skills**
Add state hooks inside `MyInternshipsPage` to track current modal tab (`"general"` | `"skills"`), master skills list, and selected skills.

```typescript
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
    const [modalTab, setModalTab] = useState<"general" | "skills">("general");

    // Master skills state
    const [masterSkills, setMasterSkills] = useState<any[]>([]);
    const [skillSearchQuery, setSkillSearchQuery] = useState("");
    
    // Skills selected in form
    const [selectedSkills, setSelectedSkills] = useState<{ skill_id: number; name: string; category: string; required: boolean }[]>([]);

    // Form inputs state
    const [formData, setFormData] = useState({
        title: "",
        department: "", // Optional helper
        location: "",
        type: "Hybrid",
        status: "open" as InternshipStatus,
        description: "",
    });

    useEffect(() => {
        async function loadMasterSkills() {
            const res = await getMasterSkills();
            if (res.success && res.skills) {
                setMasterSkills(res.skills);
            }
        }
        loadMasterSkills();
    }, []);
```

- [ ] **Step 4: Implement modal handlers**
Implement form handlers that sync selected skills with the target structure and save via Server Actions:

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
        });
        setSelectedSkills([]);
        setModalTab("general");
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: Internship) => {
        setEditingInternship(item);
        setFormData({
            title: item.title,
            department: "",
            location: item.location,
            type: item.internship_type || "Hybrid",
            status: item.status,
            description: item.description || "",
        });
        // Map skills to selected state
        setSelectedSkills(item.skills.map(s => ({
            skill_id: s.skill_id,
            name: s.name,
            category: s.category,
            required: s.required
        })));
        setModalTab("general");
        setIsModalOpen(true);
    };

    const handleToggleSkill = (skill: any) => {
        const index = selectedSkills.findIndex(s => s.skill_id === skill.id);
        if (index > -1) {
            setSelectedSkills(selectedSkills.filter(s => s.skill_id !== skill.id));
        } else {
            setSelectedSkills([...selectedSkills, {
                skill_id: skill.id,
                name: skill.name,
                category: skill.category,
                required: true // default to required
            }]);
        }
    };

    const handleToggleSkillRequired = (skillId: number, required: boolean) => {
        setSelectedSkills(selectedSkills.map(s => 
            s.skill_id === skillId ? { ...s, required } : s
        ));
    };

    const handleSaveInternship = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.location) return;

        const skillsPayload = selectedSkills.map(s => ({
            skill_id: s.skill_id,
            required: s.required
        }));

        let res;
        if (editingInternship) {
            res = await updateInternship(editingInternship.id, {
                title: formData.title,
                location: formData.location,
                internship_type: formData.type,
                status: formData.status,
                description: formData.description,
                skills: skillsPayload
            });
        } else {
            res = await createInternship({
                title: formData.title,
                location: formData.location,
                internship_type: formData.type,
                status: formData.status,
                description: formData.description,
                skills: skillsPayload
            });
        }

        if (res.success) {
            setIsModalOpen(false);
            fetchInternships();
        } else {
            alert("Error: " + res.error);
        }
    };

    const handleToggleStatus = async (id: string, newStatus: "open" | "closed") => {
        const res = await updateInternship(id, { status: newStatus });
        if (res.success) {
            fetchInternships();
        } else {
            alert("Failed to update status: " + res.error);
        }
    };
```

- [ ] **Step 5: Design Tab-based Modal UI Layout**
Integrate tabs navigation into the Create/Edit modal JSX layout inside `page.tsx`:

```tsx
{/* Modal Tabs Header */}
<div className="flex border-b border-slate-100 mb-4">
    <button
        type="button"
        onClick={() => setModalTab("general")}
        className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
            modalTab === "general"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
    >
        ข้อมูลทั่วไป (General Info)
    </button>
    <button
        type="button"
        onClick={() => setModalTab("skills")}
        className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
            modalTab === "skills"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
    >
        ทักษะที่ต้องการ (Skills Needed) ({selectedSkills.length})
    </button>
</div>
```

- [ ] **Step 6: Build Skills tab select dashboard**
Construct the skills selector block shown when `modalTab === "skills"`. Include:
- A search input filtering `masterSkills`.
- Subcategory headers grouped by category.
- Skills toggled as buttons.
- A select drop-down option next to active items setting `Required` (`true` / `false`).

- [ ] **Step 7: Render badges on cards**
Update `InternshipCardItem` to display skills as colored badges (e.g. blue color-theme for required, gray color-theme for optional):

```tsx
{/* Display skills badges */}
{item.skills && item.skills.length > 0 && (
    <div className="flex flex-wrap gap-1.5 pt-2">
        {item.skills.map((skill) => (
            <span
                key={skill.skill_id}
                className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    skill.required
                        ? "bg-blue-50 text-blue-600 border-blue-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
            >
                {skill.name} {skill.required ? "• จำเป็น" : ""}
            </span>
        ))}
    </div>
)}
```

- [ ] **Step 8: Perform final compilation check**
Run: `npm run lint`
Expected: Clean success.

- [ ] **Step 9: Commit the UI refactor**
```bash
git add app/dashboard/Internships/page.tsx
git commit -m "feat: build tab-based modal for internships info and skills selection"
```
