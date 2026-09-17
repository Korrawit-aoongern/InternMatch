# Student Resume Upload and View Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual text input for resume URL in the student profile page with a direct file upload button/area that uploads to Supabase Storage immediately, allows viewing the resume in a new tab, and supports deleting it.

**Architecture:** Create a backend server action `uploadResume` in the auth action module that creates/uploads to a `resumes` bucket. Update the React frontend page to trigger the hidden file input, upload the file dynamically, and update the state to save when changes are submitted.

**Tech Stack:** Next.js, React 19, Supabase JS, TailwindCSS, Lucide-React.

---

### Task 1: Create `uploadResume` Server Action

**Files:**
- Modify: `lib/actions/auth.ts`

- [ ] **Step 1: Add uploadResume server action toauth.ts**

Open `lib/actions/auth.ts` and add the `uploadResume` function:

```typescript
export async function uploadResume(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const supabase = getSupabaseAdmin();

    // Ensure the bucket 'resumes' exists (public access)
    try {
      await supabase.storage.createBucket("resumes", {
        public: true,
      });
    } catch {
      // Ignore if bucket already exists
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `student-resumes/${fileName}`;

    const { error } = await supabase.storage
      .from("resumes")
      .upload(filePath, buffer, {
        contentType: file.type,
        duplex: "half",
      });

    if (error) {
      console.error("Storage upload error:", error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("resumes")
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (err) {
    console.error("Error in uploadResume server action:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to upload resume" 
    };
  }
}
```

- [ ] **Step 2: Export uploadResume from auth.ts**

Ensure `uploadResume` is exported correctly alongside the other auth actions.

- [ ] **Step 3: Run typescript check to verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: Compile success with no errors in `lib/actions/auth.ts`

- [ ] **Step 4: Commit changes**

```bash
git add lib/actions/auth.ts
git commit -m "feat: add uploadResume server action"
```

---

### Task 2: Redesign Resume Card UI and Logic in Profile Page

**Files:**
- Modify: `app/dashboard/profile/page.tsx`

- [ ] **Step 1: Import uploadResume server action and Lucide icons**

At the top of `app/dashboard/profile/page.tsx`, import `uploadResume` from `@/lib/actions/auth` and import `Upload`, `Trash2`, and `Loader2` from `lucide-react`.

```typescript
// Modify imports from "@/lib/actions/auth" to include uploadResume
import { getStudentProfile, updateStudentProfile, getCompanyProfile, updateCompanyProfile, uploadProfileImage, changeUserPassword, uploadResume } from "@/lib/actions/auth";

// Modify imports from "lucide-react" to include Trash2, Upload, Loader2
import {
  Save,
  Camera,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  FileText,
  Globe,
  Code,
  Link2,
  User,
  Trash2,
  Upload,
  Loader2,
} from "lucide-react";
```

- [ ] **Step 2: Add refs and state for resume upload**

Inside `ProfilePage` component:
* Add `resumeInputRef` using `React.useRef<HTMLInputElement>(null)`.
* Add `isUploadingResume` state.

```typescript
const resumeInputRef = React.useRef<HTMLInputElement>(null);
const [isUploadingResume, setIsUploadingResume] = useState(false);
```

- [ ] **Step 3: Add event handlers for resume upload and delete**

Inside `ProfilePage` component, add the handlers:

```typescript
const handleResumeUploadClick = () => {
  resumeInputRef.current?.click();
};

const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  setIsUploadingResume(true);
  try {
    const res = await uploadResume(formData);
    if (res.success && res.url) {
      setProfile((prev) => ({
        ...prev,
        resume_url: res.url || "",
      }));
    } else {
      alert("Upload failed: " + res.error);
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert("An error occurred during file upload.");
  } finally {
    setIsUploadingResume(false);
  }
};

const handleDeleteResume = () => {
  if (confirm("Are you sure you want to delete your resume?")) {
    setProfile((prev) => ({
      ...prev,
      resume_url: "",
    }));
  }
};
```

- [ ] **Step 4: Update the Resume Card JSX UI**

Replace the existing Resume Card component markup (lines 702-764) with the following structure:

```tsx
                  {/* Resume Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 h-full flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Resume
                      </h3>

                      {profile.resume_url ? (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3 overflow-hidden mr-2">
                            <div className="bg-red-100 text-red-600 p-2.5 rounded-lg flex-shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {profile.resume_url.split("/").pop()}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {profile.resume_url}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={profile.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </a>
                            <button
                              type="button"
                              onClick={handleDeleteResume}
                              className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold p-1.5 rounded-lg transition-colors"
                              title="Delete Resume"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={handleResumeUploadClick}
                          className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all mb-4 text-center group"
                        >
                          {isUploadingResume ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                              <p className="text-xs font-bold text-slate-500">Uploading...</p>
                            </div>
                          ) : (
                            <>
                              <div className="bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 p-3 rounded-full transition-colors mb-2">
                                <Upload className="w-6 h-6" />
                              </div>
                              <p className="text-xs font-bold text-slate-700">Click to upload resume</p>
                              <p className="text-[10px] text-slate-400 mt-1">PDF, Word, or images</p>
                            </>
                          )}
                        </div>
                      )}
                      
                      <input
                        type="file"
                        ref={resumeInputRef}
                        onChange={handleResumeFileChange}
                        accept=".pdf,.doc,.docx,image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
```

- [ ] **Step 5: Verify building and check typescript errors**

Run: `npm run build`
Expected: Compile succeeds with no errors.

- [ ] **Step 6: Commit changes**

```bash
git add app/dashboard/profile/page.tsx
git commit -m "feat: redesign Resume Card with file upload and view/delete UX"
```
