# Student Skills Level Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify student skills display on both internship cards and details modals to append the skill level in parentheses, e.g., `React (Advanced)`.

**Tech Stack:** Next.js (App Router), React 19, TailwindCSS.

---

### Task 1: Append Level to Student Skills Tags

**Files:**
- Modify: `app/dashboard/Internships/page.tsx`

- [ ] **Step 1: Modify `StudentInternshipCardItem`**
Update the text inside the mapping callback from `{skill.name}` to `{skill.name} ({skill.level})`.

- [ ] **Step 2: Modify `StudentInternshipDetailsModal`**
Similarly, update the text inside the details modal student skills tags from `{skill.name}` to `{skill.name} ({skill.level})`.

- [ ] **Step 3: Commit UI changes**
```bash
git add app/dashboard/Internships/page.tsx
git commit -m "feat: show skill level in student skills tags"
```

---

### Task 2: Verification and Build Check

**Files:**
- None (verification commands)

- [ ] **Step 4: Check TypeScript compiler compilation**
Run: `npx tsc --noEmit`
Expected: Passes without errors.

- [ ] **Step 5: Run build test to check Next.js build compilation**
Run: `npm run build`
Expected: Next.js build finishes successfully.
