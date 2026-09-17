# Design Document: Student Resume Upload and View Feature

## Overview
This feature allows students to upload their resume files to Supabase Storage, view them directly, and save the resume URL to their student profile. The design uses immediate upload upon selection (reusing patterns from the profile image upload) and updates the database profile upon saving the page changes.

## Backend Changes

### 1. New Server Action: `uploadResume`
File: [`lib/actions/auth.ts`](file:///D:/In/internmatch/front/lib/actions/auth.ts)

A new server action will handle uploading files to a dedicated `resumes` bucket in Supabase.

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

---

## Frontend Changes

### 2. Profile Page: Resume Card Redesign
File: [`app/dashboard/profile/page.tsx`](file:///D:/In/internmatch/front/app/dashboard/profile/page.tsx)

We will replace the text-input representation of the "Resume URL" with a file-upload representation.

#### State & Ref
* Add a `resumeInputRef` using `React.useRef<HTMLInputElement>(null)` to trigger the hidden file input.
* Track upload state using `isUploadingResume` (boolean).

#### Selection & Upload Callback
* `handleResumeUploadClick()` triggers `resumeInputRef.current?.click()`.
* `handleResumeFileChange(e)`:
  1. Triggered on file selection.
  2. Constructs `FormData` and sends to `uploadResume`.
  3. Updates `profile.resume_url` with the returned public URL.
  4. Displays loading indicator during upload.

#### Deletion Callback
* `handleDeleteResume()`:
  1. Clears `profile.resume_url` by setting it to `""`.
  2. The update is finalized when the user clicks "Save Changes".

#### JSX Markup Updates (Resume Card)
* When `profile.resume_url` is present:
  * Show a preview/details container with a PDF/file icon, filename (extracted from URL), and the URL.
  * Provide a **View** button (opens URL in a new tab).
  * Provide a **Delete** button (trash/close icon) which clears the field.
* When `profile.resume_url` is empty:
  * Show an upload dropzone/area with an upload icon, indicating click-to-upload (supports all file types).
* Display a spinner/loading state when `isUploadingResume` is true.

---

## Database Constraints
* Schema contains `resume_url text null` in `public.students`.
* Save Changes uses `updateStudentProfile` which already saves `resume_url` to the database. No database schema changes are required.

## Verification & Testing
1. Upload a sample PDF/Word/Image file. Verify it uploads to Supabase and updates the URL.
2. View the uploaded file by clicking the view button. Verify it opens in a new tab correctly.
3. Delete the uploaded file. Verify the preview disappears and saving updates the profile with a null/empty resume.
