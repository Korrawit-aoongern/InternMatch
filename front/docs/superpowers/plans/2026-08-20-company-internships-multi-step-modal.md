# Company Internships Multi-step Modal & Skills Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 2-step wizard modal for creating/editing internship postings with skills mapping to `public.internship_skills` and persistent database storage (including the `department` column) using Supabase Server Actions.

**Architecture:** Update Next.js Server Actions in `lib/actions/internships.ts` to support querying/mutating `internships.department` and the `internship_skills` mapping table. Refactor `app/dashboard/Internships/page.tsx` client component to fetch master skills, manage the 2-step wizard state, and display required/optional badges.

**Tech Stack:** Next.js (App Router), React 19, Supabase JS, TailwindCSS, Lucide Icons.

---

### Task 1: Update Server Actions in `lib/actions/internships.ts`

**Files:**
- Modify: `lib/actions/internships.ts`

- [ ] **Step 1: Update type definitions & interfaces**
  Modify `lib/actions/internships.ts` to include `InternshipSkill` and `InternshipSkillInput` definitions, and update `InternshipInput` to accept the `department` and `skills` array.
  
  Replace lines 16-22 with:
  ```typescript
  export interface InternshipSkill {
    id: string;
    skill_id: number;
    name: string;
    category: string;
    required: boolean;
  }

  export interface InternshipSkillInput {
    skill_id: number;
    required: boolean;
  }

  export interface InternshipInput {
    title: string;
    department: string;
    description: string;
    location: string;
    internship_type: string;
    status: "open" | "closed";
    skills?: InternshipSkillInput[];
  }
  ```

- [ ] **Step 2: Update getCompanyInternships to fetch department and skills**
  Modify `getCompanyInternships` to query the `department` column and join the `internship_skills` and `skills` tables.
  
  Replace `getCompanyInternships` implementation (lines 59-101) with:
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
        department: item.department || "",
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

- [ ] **Step 3: Update createInternship to insert department and skills**
  Modify `createInternship` to save the new internship (including the `department` column) and insert its associated skills.
  
  Replace `createInternship` implementation (lines 103-136) with:
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
            department: input.department.trim(),
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
  Modify `updateInternship` to update internship details (including the `department` column) and rebuild the `internship_skills` associations. Add type safety checks for partial inputs.
  
  Replace `updateInternship` implementation (lines 138-181) with:
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

      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title.trim();
      if (input.department !== undefined) updateData.department = input.department.trim();
      if (input.description !== undefined) updateData.description = input.description.trim();
      if (input.location !== undefined) updateData.location = input.location.trim();
      if (input.internship_type !== undefined) updateData.internship_type = input.internship_type;
      if (input.status !== undefined) updateData.status = input.status;

      const { data, error } = await supabase
        .from("internships")
        .update(updateData)
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

- [ ] **Step 5: Add deleteInternship action**
  Add a `deleteInternship` server action to delete the internship posting. The foreign key constraint deletes corresponding skills cascades.
  
  Append this function after `updateInternship` but before `getInternshipApplicants`:
  ```typescript
  export async function deleteInternship(id: string) {
    try {
      const supabase = getSupabaseAdmin();
      const companyId = await getCurrentCompanyId(supabase);

      // Verify ownership before deleting
      const { data: existing, error: findError } = await supabase
        .from("internships")
        .select("id")
        .eq("id", id)
        .eq("company_id", companyId)
        .maybeSingle();

      if (findError || !existing) {
        return { success: false, error: "Internship posting not found or unauthorized access" };
      }

      const { error } = await supabase
        .from("internships")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting internship:", error);
        return { success: false, error: error.message };
      }

      return { success: true, message: "ลบประกาศรับสมัครงานสำเร็จเรียบร้อย! 🎉" };
    } catch (err: unknown) {
      console.error("Exception in deleteInternship:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete internship",
      };
    }
  }
  ```

- [ ] **Step 6: Run tests and TypeScript build check**
  Run: `npx tsc --noEmit`
  Expected: Clean compilation with zero errors.

- [ ] **Step 7: Commit backend updates**
  ```bash
  git add lib/actions/internships.ts
  git commit -m "feat: update server actions to support skills and department"
  ```

---

### Task 2: Implement UI & Multi-step Wizard in `app/dashboard/Internships/page.tsx`

**Files:**
- Modify: `app/dashboard/Internships/page.tsx`

- [ ] **Step 1: Replace Types and Imports with Server-Action Compatible Ones**
  Modify imports and types at the top of `app/dashboard/Internships/page.tsx`. Use `open` and `closed` as the status values.
  
  Replace lines 1-38 with:
  ```typescript
  "use client";

  import React, { useState, useMemo, useEffect } from "react";
  import { useRouter } from "next/navigation";
  import DashboardSidebar from "@/components/layout/DashboardSidebar";
  import DashboardHeader from "@/components/layout/DashboardHeader";
  import { getUserRole } from "@/lib/actions/auth";
  import {
      getCompanyInternships,
      createInternship,
      updateInternship,
      deleteInternship
  } from "@/lib/actions/internships";
  import { getMasterSkills } from "@/lib/actions/skills";
  import {
      PlusCircle,
      Search,
      MapPin,
      MoreVertical,
      Pencil,
      Users,
      Eye,
      X,
      CheckCircle2,
      XCircle,
      Building2,
      Calendar,
      Briefcase,
      Trash2,
      ChevronRight,
      ChevronLeft
  } from "lucide-react";

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
      department: string;
      location: string;
      internship_type: string;
      status: InternshipStatus;
      applicantsCount: number;
      postedDate: string;
      description?: string;
      skills: InternshipSkill[];
  }
  ```

- [ ] **Step 2: Sync Page State Hooks and Database Handlers**
  Update state hooks inside the `MyInternshipsPage` component to fetch listings dynamically and load master skills. Remove all localStorage syncing code.
  
  Replace lines 93-285 with:
  ```typescript
  export default function MyInternshipsPage() {
      const [internships, setInternships] = useState<Internship[]>([]);
      const [isLoading, setIsLoading] = useState(true);
      const [searchQuery, setSearchQuery] = useState("");
      const [activeTab, setActiveTab] = useState<string>("All");
      const [isCheckingRole, setIsCheckingRole] = useState(true);
      const router = useRouter();

      // Modal Wizard States
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
      const [currentStep, setCurrentStep] = useState<1 | 2>(1);

      // Skills data lists
      const [masterSkills, setMasterSkills] = useState<any[]>([]);
      const [skillSearchQuery, setSkillSearchQuery] = useState("");
      const [selectedSkills, setSelectedSkills] = useState<{
          skill_id: number;
          name: string;
          category: string;
          required: boolean;
      }[]>([]);

      // View Applicants modal state
      const [viewingApplicantsInternship, setViewingApplicantsInternship] = useState<Internship | null>(null);

      // Form state
      const [formData, setFormData] = useState({
          title: "",
          department: "",
          location: "",
          type: "Hybrid",
          status: "open" as InternshipStatus,
          description: "",
      });

      // Role authorization check
      useEffect(() => {
          async function checkRole() {
              try {
                  const res = await getUserRole();
                  if (!res.success || res.role !== "company") {
                      router.push("/dashboard");
                      return;
                  }
                  setIsCheckingRole(false);
              } catch (err) {
                  console.error("Error checking role in Internships page:", err);
                  router.push("/dashboard");
              }
          }
          checkRole();
      }, [router]);

      const fetchInternships = async () => {
          setIsLoading(true);
          try {
              const res = await getCompanyInternships();
              if (res.success && res.internships) {
                  const mapped = res.internships.map((item: any) => ({
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
                      description: item.description || ""
                  }));
                  setInternships(mapped);
              }
          } catch (err) {
              console.error("Failed to load internships:", err);
          } finally {
              setIsLoading(false);
          }
      };

      // Load internships and master skills on mount
      useEffect(() => {
          fetchInternships();
          async function loadMasterSkills() {
              try {
                  const res = await getMasterSkills();
                  if (res.success && res.skills) {
                      setMasterSkills(res.skills);
                  }
              } catch (err) {
                  console.error("Failed to load master skills:", err);
              }
          }
          loadMasterSkills();
      }, []);

      // Filtered internships calculation
      const counts = useMemo(() => {
          return {
              All: internships.length,
              Active: internships.filter((item) => item.status === "open").length,
              Closed: internships.filter((item) => item.status === "closed").length,
          };
      }, [internships]);

      const filteredInternships = useMemo(() => {
          return internships.filter((item) => {
              if (activeTab === "Active" && item.status !== "open") return false;
              if (activeTab === "Closed" && item.status !== "closed") return false;

              if (searchQuery.trim() !== "") {
                  const query = searchQuery.toLowerCase();
                  const matchTitle = item.title.toLowerCase().includes(query);
                  const matchLocation = item.location.toLowerCase().includes(query);
                  const matchDept = (item.department || "").toLowerCase().includes(query);
                  return matchTitle || matchLocation || matchDept;
              }
              return true;
          });
      }, [internships, activeTab, searchQuery]);

      // Open Modal Handlers
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
          });
          setSelectedSkills(item.skills.map(s => ({
              skill_id: s.skill_id,
              name: s.name,
              category: s.category,
              required: s.required
          })));
          setCurrentStep(1);
          setIsModalOpen(true);
      };

      // Toggle skills selection in Step 2
      const handleToggleSkill = (skill: any) => {
          const index = selectedSkills.findIndex(s => s.skill_id === skill.id);
          if (index > -1) {
              setSelectedSkills(selectedSkills.filter(s => s.skill_id !== skill.id));
          } else {
              setSelectedSkills([...selectedSkills, {
                  skill_id: skill.id,
                  name: skill.name,
                  category: skill.category,
                  required: true // defaults to necessary/required
              }]);
          }
      };

      const handleToggleSkillRequired = (skillId: number, required: boolean) => {
          setSelectedSkills(selectedSkills.map(s =>
              s.skill_id === skillId ? { ...s, required } : s
          ));
      };

      // Toggle status quickly
      const handleToggleStatus = async (id: string, newStatus: InternshipStatus) => {
          const res = await updateInternship(id, { status: newStatus });
          if (res.success) {
              fetchInternships();
          } else {
              alert("Failed to update status: " + res.error);
          }
      };

      // Delete Internship Action
      const handleDeleteInternship = async (id: string) => {
          if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประกาศรับสมัครฝึกงานนี้?")) {
              const res = await deleteInternship(id);
              if (res.success) {
                  fetchInternships();
                  setIsModalOpen(false);
                  setEditingInternship(null);
              } else {
                  alert("Failed to delete internship: " + res.error);
              }
          }
      };

      // Unified Save Handler (inserts matching skills inside same transaction)
      const handleSaveInternship = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!formData.title || !formData.location || !formData.description) return;

          const skillsPayload = selectedSkills.map(s => ({
              skill_id: s.skill_id,
              required: s.required
          }));

          let res;
          if (editingInternship) {
              res = await updateInternship(editingInternship.id, {
                  title: formData.title,
                  department: formData.department,
                  location: formData.location,
                  internship_type: formData.type,
                  status: formData.status,
                  description: formData.description,
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
                  skills: skillsPayload
              });
          }

          if (res.success) {
              setIsModalOpen(false);
              fetchInternships();
          } else {
              alert("Error saving: " + res.error);
          }
      };
  ```

- [ ] **Step 3: Update Filters, Tabs Header, and Empty States on the Page**
  Modify filters and headers. Change Drafts filter tab to only support open/closed.
  
  Replace lines 347-367 (or relative references to status tabs) with:
  ```tsx
                          {/* Status Filter Tabs */}
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                              {[
                                  { label: "All", count: counts.All },
                                  { label: "Active", count: counts.Active },
                                  { label: "Closed", count: counts.Closed },
                              ].map((tab) => (
                                  <button
                                      key={tab.label}
                                      onClick={() => setActiveTab(tab.label)}
                                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${activeTab === tab.label
                                              ? "bg-blue-50 text-blue-600 border-blue-200"
                                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                          }`}
                                  >
                                      {tab.label === "Active" ? "Active (เปิดรับ)" : tab.label === "Closed" ? "Closed (ปิดรับ)" : "All"} ({tab.count})
                                  </button>
                              ))}
                          </div>
  ```

- [ ] **Step 4: Design the 2-step Multi-step Wizard Modal JSX**
  Replace the Modal markup inside `app/dashboard/Internships/page.tsx` (lines 391-543) with the multi-step layout. Put a progress bar indicator, step 1 fields, and step 2 skills filter/list.
  
  Replace `isModalOpen` modal section block with:
  ```tsx
                      {/* Modal: Create & Edit Internship (Multi-step) */}
                      {isModalOpen && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-5 shadow-xl border border-slate-100 max-h-[90vh] flex flex-col justify-between">
                                  
                                  {/* Header */}
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                                      <div>
                                          <h2 className="text-xl font-bold text-slate-800">
                                              {editingInternship ? "แก้ไขประกาศรับสมัครฝึกงาน" : "สร้างประกาศรับสมัครฝึกงานใหม่"}
                                          </h2>
                                          <p className="text-xs text-slate-500 mt-1">
                                              ขั้นตอนที่ {currentStep} จาก 2: {currentStep === 1 ? "กรอกข้อมูลทั่วไป" : "ระบุทักษะที่ต้องการ"}
                                          </p>
                                      </div>
                                      <button
                                          onClick={() => setIsModalOpen(false)}
                                          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
                                      >
                                          <X className="w-5 h-5" />
                                      </button>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                      <div 
                                          className="bg-blue-600 h-full transition-all duration-300"
                                          style={{ width: `${currentStep * 50}%` }}
                                      />
                                  </div>

                                  {/* Form content (scrollable area) */}
                                  <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-4">
                                      {currentStep === 1 ? (
                                          <div className="space-y-4">
                                              <div>
                                                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                      ชื่อตำแหน่งงาน *
                                                  </label>
                                                  <input
                                                      type="text"
                                                      required
                                                      value={formData.title}
                                                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                      placeholder="เช่น Software Engineering Intern"
                                                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                  />
                                              </div>

                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                  <div>
                                                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                          แผนก / ฝ่าย *
                                                      </label>
                                                      <input
                                                          type="text"
                                                          required
                                                          value={formData.department}
                                                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                          placeholder="เช่น Engineering, Marketing"
                                                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                      />
                                                  </div>
                                                  <div>
                                                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                          รูปแบบงาน
                                                      </label>
                                                      <select
                                                          value={formData.type}
                                                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                                      >
                                                          <option value="Hybrid">Hybrid</option>
                                                          <option value="Remote">Remote</option>
                                                          <option value="On-site">On-site</option>
                                                      </select>
                                                  </div>
                                              </div>

                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                  <div>
                                                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                          สถานที่ทำงาน / จังหวัด *
                                                      </label>
                                                      <input
                                                          type="text"
                                                          required
                                                          value={formData.location}
                                                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                          placeholder="เช่น กรุงเทพมหานคร"
                                                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                  />
                                                  </div>
                                                  <div>
                                                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                          สถานะประกาศ
                                                      </label>
                                                      <select
                                                          value={formData.status}
                                                          onChange={(e) => setFormData({ ...formData, status: e.target.value as InternshipStatus })}
                                                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                                      >
                                                          <option value="open">Active (เปิดรับสมัคร)</option>
                                                          <option value="closed">Closed (ปิดรับสมัคร)</option>
                                                      </select>
                                                  </div>
                                              </div>

                                              <div>
                                                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                      รายละเอียดงาน (Job Description) *
                                                  </label>
                                                  <textarea
                                                      rows={5}
                                                      required
                                                      value={formData.description}
                                                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                      placeholder="รายละเอียดการทำงาน หน้าที่ความรับผิดชอบ..."
                                                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                  />
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="space-y-4">
                                              {/* Skill Selection Step */}
                                              <div>
                                                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                                      พิมพ์ค้นหาและเลือกทักษะที่เกี่ยวข้อง
                                                  </label>
                                                  <div className="relative mb-4">
                                                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                      <input
                                                          type="text"
                                                          value={skillSearchQuery}
                                                          onChange={(e) => setSkillSearchQuery(e.target.value)}
                                                          placeholder="ค้นหาทักษะ... เช่น Javascript, React, Figma"
                                                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                      />
                                                  </div>
                                              </div>

                                              {/* Selected skills summary list with Required / Optional dropdown */}
                                              {selectedSkills.length > 0 && (
                                                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                                          ทักษะที่เลือกแล้ว ({selectedSkills.length})
                                                      </h3>
                                                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                                          {selectedSkills.map((s) => (
                                                              <div key={s.skill_id} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                                                  <span className="text-sm font-semibold text-slate-700">{s.name} <span className="text-[10px] text-slate-400">({s.category})</span></span>
                                                                  <div className="flex items-center gap-2">
                                                                      <select
                                                                          value={s.required ? "true" : "false"}
                                                                          onChange={(e) => handleToggleSkillRequired(s.skill_id, e.target.value === "true")}
                                                                          className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50 font-medium"
                                                                      >
                                                                          <option value="true">จำเป็น (Required)</option>
                                                                          <option value="false">แนะนำ/เสริม (Optional)</option>
                                                                      </select>
                                                                      <button
                                                                          type="button"
                                                                          onClick={() => handleToggleSkill({ id: s.skill_id })}
                                                                          className="text-rose-500 hover:text-rose-700 font-bold text-sm px-1.5"
                                                                      >
                                                                          ✕
                                                                      </button>
                                                                  </div>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  </div>
                                              )}

                                              {/* Master Skills list grouped by category */}
                                              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                                                  {Object.entries(
                                                      masterSkills
                                                          .filter(s => s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                                                          .reduce((acc: any, skill: any) => {
                                                              acc[skill.category] = acc[skill.category] || [];
                                                              acc[skill.category].push(skill);
                                                              return acc;
                                                          }, {})
                                                  ).map(([category, skills]: [string, any]) => (
                                                      <div key={category} className="space-y-1.5">
                                                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                              {category}
                                                          </h4>
                                                          <div className="flex flex-wrap gap-2">
                                                              {skills.map((skill: any) => {
                                                                  const isSelected = selectedSkills.some(s => s.skill_id === skill.id);
                                                                  return (
                                                                      <button
                                                                          key={skill.id}
                                                                          type="button"
                                                                          onClick={() => handleToggleSkill(skill)}
                                                                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                                                              isSelected
                                                                                  ? "bg-blue-600 border-blue-600 text-white"
                                                                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                                                          }`}
                                                                      >
                                                                          {skill.name}
                                                                      </button>
                                                                  );
                                                              })}
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                  </div>

                                  {/* Footer Actions */}
                                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 shrink-0">
                                      <div>
                                          {editingInternship && currentStep === 1 ? (
                                              <button
                                                  type="button"
                                                  onClick={() => handleDeleteInternship(editingInternship.id)}
                                                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                              >
                                                  <Trash2 className="w-4 h-4" />
                                                  ลบประกาศนี้
                                              </button>
                                          ) : <div />}
                                      </div>

                                      <div className="flex items-center gap-3">
                                          {currentStep === 1 ? (
                                              <>
                                                  <button
                                                      type="button"
                                                      onClick={() => setIsModalOpen(false)}
                                                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                                                  >
                                                      ยกเลิก
                                                  </button>
                                                  <button
                                                      type="button"
                                                      onClick={() => {
                                                          if (formData.title && formData.location && formData.description && formData.department) {
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
                                              </>
                                          ) : (
                                              <>
                                                  <button
                                                      type="button"
                                                      onClick={() => setCurrentStep(1)}
                                                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-1.5"
                                                  >
                                                      <ChevronLeft className="w-4 h-4" />
                                                      ย้อนกลับ
                                                  </button>
                                                  <button
                                                      type="button"
                                                      onClick={handleSaveInternship}
                                                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                                                  >
                                                      {editingInternship ? "บันทึกการแก้ไข" : "สร้างประกาศ"}
                                                  </button>
                                              </>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
  ```

- [ ] **Step 5: Render Skills Badges on Card Component**
  Modify the `InternshipCardItem` component inside `app/dashboard/Internships/page.tsx` (lines 594-818) to accept `Internship` parameter interface correctly, display skill badges with proper blue/slate theme colors, and map statuses correctly.
  
  Replace `InternshipCardItem` component from line 594 onwards with:
  ```tsx
  {/* Card Component */}
  function InternshipCardItem({
      item,
      onEdit,
      onToggleStatus,
      onDelete,
      onViewApplicants
  }: {
      item: Internship;
      onEdit: () => void;
      onToggleStatus: (id: string, status: InternshipStatus) => void;
      onDelete: () => void;
      onViewApplicants: () => void;
  }) {
      const [showDropdown, setShowDropdown] = useState(false);
      const { status, title, department, location, applicantsCount, postedDate, skills } = item;

      const getStatusStyles = () => {
          switch (status) {
              case "open":
                  return {
                      borderLeft: "border-l-4 border-l-blue-600",
                      badgeBg: "bg-blue-50 text-blue-600",
                      dotColor: "bg-blue-600",
                  };
              case "closed":
                  return {
                      borderLeft: "border-l-4 border-l-rose-600",
                      badgeBg: "bg-rose-50 text-rose-600",
                      dotColor: "border border-rose-600",
                  };
              default:
                  return {};
          }
      };

      const styles = getStatusStyles();

      const formatDate = (dateStr: string) => {
          if (!dateStr) return "-";
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return dateStr;
          return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      };

      return (
          <div
              className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${styles.borderLeft}`}
          >
              {/* Header Info */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between relative">
                      <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${styles.badgeBg}`}
                      >
                          {status === "open" ? (
                              <>
                                  <span className={`w-1.5 h-1.5 rounded-full ${styles.dotColor}`} />
                                  Active
                              </>
                          ) : (
                              <>
                                  <span className="w-1.5 h-1.5 rounded-full border border-rose-600" />
                                  Closed
                              </>
                          )}
                      </span>

                      {/* Action menu dropdown */}
                      <div className="relative">
                          <button
                              onClick={() => setShowDropdown(!showDropdown)}
                              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                          >
                              <MoreVertical className="w-4 h-4" />
                          </button>
                          {showDropdown && (
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 text-xs">
                                  <button
                                      onClick={() => {
                                          setShowDropdown(false);
                                          onEdit();
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                      <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                      แก้ไขประกาศ
                                  </button>
                                  {status !== "open" ? (
                                      <button
                                          onClick={() => {
                                              setShowDropdown(false);
                                              onToggleStatus(item.id, "open");
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                      >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          เปลี่ยนเป็น Active
                                      </button>
                                  ) : (
                                      <button
                                          onClick={() => {
                                              setShowDropdown(false);
                                              onToggleStatus(item.id, "closed");
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                      >
                                          <XCircle className="w-3.5 h-3.5" />
                                          เปลี่ยนเป็น Closed
                                      </button>
                                  )}
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                      onClick={() => {
                                          setShowDropdown(false);
                                          onDelete();
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                                  >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      ลบประกาศ
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>

                  <div>
                      <h3 className="text-base font-bold text-slate-800 line-clamp-1">{title}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{department || "General Department"}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {location}
                      </p>
                  </div>

                  {/* Skills Section */}
                  {skills && skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                          {skills.map((skill) => (
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
              </div>

              {/* Middle Applicants Info */}
              <div className="flex items-baseline gap-6 pt-2 border-t border-slate-100">
                  {status === "closed" ? (
                      <div>
                          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                              TOTAL APPLICANTS
                          </p>
                          <p className="text-xl font-bold text-slate-800 mt-0.5">{applicantsCount}</p>
                      </div>
                  ) : (
                      <div>
                          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                              APPLICANTS
                          </p>
                          <p className="text-xl font-bold text-slate-800 mt-0.5">
                              {applicantsCount !== undefined ? applicantsCount : "0"}
                          </p>
                      </div>
                  )}

                  <div>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          {status === "closed" ? "CLOSED ON" : "POSTED"}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 mt-1">{formatDate(postedDate)}</p>
                  </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                  {status === "open" ? (
                      <div className="grid grid-cols-2 gap-2">
                          <button
                              onClick={onEdit}
                              className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2 px-3 rounded-xl transition-colors"
                          >
                              <Pencil className="w-3.5 h-3.5 text-blue-600" />
                              Edit
                          </button>
                          <button
                              onClick={onViewApplicants}
                              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors shadow-sm"
                          >
                              <Users className="w-3.5 h-3.5" />
                              View ({applicantsCount})
                          </button>
                      </div>
                  ) : (
                      <button
                          onClick={onViewApplicants}
                          className="w-full flex items-center justify-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-bold py-2 px-3 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                          <Eye className="w-3.5 h-3.5" />
                          View Archive ({applicantsCount})
                      </button>
                  )}
              </div>
          </div>
      );
  }
  ```

- [ ] **Step 6: Run final lint checks and static builds**
  Run: `npm run lint`
  Expected: Clean compile output.

- [ ] **Step 7: Commit UI changes**
  ```bash
  git add app/dashboard/Internships/page.tsx
  git commit -m "feat: complete UI multi-step wizard and card rendering for skills"
  ```
