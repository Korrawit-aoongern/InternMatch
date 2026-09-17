# Design Document: Internship Responsibilities Field

## Overview
This feature adds a required `responsibilities` field to the internship posting and edit forms for company users. The data is persisted in the `public.internships` database table under the `responsibilities` column (type `text`).

## Database Schema Reference
Table: `public.internships`
Mapped column:
- `responsibilities` (text, nullable in DB, but required in UI form validation)

---

## Backend Changes

### File: [lib/actions/internships.ts](file:///D:/In/internmatch/front/lib/actions/internships.ts)
- Update `InternshipInput` interface to include `responsibilities` field:
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
- Update `getCompanyInternships()` server action mapping to extract `responsibilities`:
  ```typescript
  responsibilities: item.responsibilities || "",
  ```
- Update `createInternship()` server action insert payload to include `responsibilities`:
  ```typescript
  responsibilities: input.responsibilities.trim(),
  ```
- Update `updateInternship()` server action update payload to include `responsibilities`:
  ```typescript
  if (input.responsibilities !== undefined) updateData.responsibilities = input.responsibilities.trim();
  ```

---

## Frontend Changes

### File: [app/dashboard/Internships/page.tsx](file:///D:/In/internmatch/front/app/dashboard/Internships/page.tsx)
- Update `Internship` interface:
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
- Update `formData` state:
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
- Update mapping in `fetchInternships` and `loadInitialData`:
  ```typescript
  responsibilities: item.responsibilities || "",
  ```
- Update modal open handlers:
  - `handleOpenCreateModal`: Reset `responsibilities: ""`
  - `handleOpenEditModal`: Set `responsibilities: item.responsibilities || ""`
- Update verification condition in "ถัดไป" (Step 1 -> 2 transition) button:
  ```typescript
  if (formData.title && formData.location && formData.description && formData.department && formData.responsibilities) {
      setCurrentStep(2);
  } else {
      alert("กรุณากรอกข้อมูลจำเป็นให้ครบถ้วนก่อนไปขั้นตอนถัดไป (*)");
  }
  ```
- Update save handler `handleSaveInternship`:
  Include `responsibilities: formData.responsibilities` in the payload passed to `createInternship` and `updateInternship`.
- Update JSX in Step 1 form:
  Add a `<textarea>` for "หน้าที่ความรับผิดชอบ (Responsibilities) *" immediately below the "รายละเอียดงาน (Job Description) *" field.

---

## Verification & Testing Plan
1. **Modal Validation**: Open the "Create New Internship" modal, leave "หน้าที่ความรับผิดชอบ" blank, fill other fields, and click "ถัดไป". Verify it shows an alert warning.
2. **Creation Flow**: Fill all fields (including responsibilities) and proceed to Step 2. Select skills and save. Verify the internship is saved in the database.
3. **Edit Flow**: Open the created internship in edit mode. Verify the "หน้าที่ความรับผิดชอบ" field is loaded correctly.
4. **Update Flow**: Change the responsibilities content, save, and reopen to verify it updated.
