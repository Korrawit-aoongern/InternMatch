# Design Document: Matches Page with AI Skill-Gap Analysis & Course Recommendations (Mock Frontend Prototyping)

## Overview
This feature creates a dedicated **Matches** page (`/matches`) for students. The page lists internship postings sorted by their match score with the student's profile skills. 
When a student clicks an internship card, a focused **Modal Pop-card** opens, displaying a side-by-side split screen layout:
- **Left Column**: General internship details, required skills, and comparison with student's skills (missing or under-leveled).
- **Right Column**: Friendly, simulated AI analysis text in Thai detailing study recommendations, followed by a list of matching courses or video clips (including their publisher/source platform).

To facilitate rapid prototyping, all AI analysis text and recommended resources are mocked on the frontend based on the actual skill gaps, without calling the Gemini API or creating database migrations.

---

## Technical Architecture & Flow

1. **User Action**: The student visits `/matches` from the sidebar and clicks on an internship card.
2. **Modal Initial State**: The modal opens, displaying a loading state for **1.2 seconds** (simulating AI computation latency).
3. **Gap Analysis & Mocking**:
   - Compare student skills (`student_skills`) and internship skills (`internship_skills`).
   - Identify **Missing Skills** (not in profile) and **Under-leveled Skills** (required level > student level).
   - Retrieve matching mock courses from a static registry in the code, showing the publisher/author (e.g. `KongRuksiam`, `Stanford University`) and platform (e.g. `YouTube`, `Coursera`).
   - Produce a personalized advice text in Thai customized to the identified gaps.
4. **Render UI**: Show the details side-by-side on desktop (collapsing to a stacked list on mobile).

---

## File Changes & Creation

### 1. New Page: [app/matches/page.tsx](file:///D:/In/internmatch/front/app/matches/page.tsx)
Create a new Next.js page component for the `/matches` route.

#### Key Features:
- Fetch student internships using existing action `getStudentInternships()`.
- Fetch student skills using `getStudentSkills()`.
- Sort and filter internships by match score descending.
- Render a header: `"AI Matches & Upskilling"`.
- Render a grid of internship cards:
  - Match score badge in the top right.
  - Position title, company name, location, and list of required/matching skills.
- Handle modal opening on click:
  - Display `<MatchesInternshipDetailsModal>` when a card is selected.

---

### 2. Mock Data Registry in Code
Define a static mapping of skill names/IDs to recommended courses in `app/matches/page.tsx` or a helper utility:

```typescript
export interface MockResource {
  id: string;
  title: string;
  url: string;
  platform: "YouTube" | "Coursera" | "Udemy" | "Other";
  author: string; // Publisher or creator name
  level: "Beginner" | "Intermediate" | "Advanced";
  resource_type: "video" | "course";
}

export const MOCK_RESOURCES: Record<string, MockResource[]> = {
  "react": [
    {
      id: "r1",
      title: "React State Management (Redux/Zustand) in 1 Hour",
      url: "https://www.youtube.com/watch?v=mock_react_1",
      platform: "YouTube",
      author: "KongRuksiam Official",
      level: "Intermediate",
      resource_type: "video"
    },
    {
      id: "r2",
      title: "Ultimate React & Next.js Professional Course",
      url: "https://www.coursera.org/learn/mock_react_2",
      platform: "Coursera",
      author: "Stanford University",
      level: "Advanced",
      resource_type: "course"
    }
  ],
  "node.js": [
    {
      id: "n1",
      title: "Node.js & Express.js API Crash Course for Beginners",
      url: "https://www.youtube.com/watch?v=mock_node_1",
      platform: "YouTube",
      author: "Code Camp Thailand",
      level: "Beginner",
      resource_type: "video"
    }
  ],
  "typescript": [
    {
      id: "t1",
      title: "TypeScript Deep Dive & Best Practices",
      url: "https://www.udemy.com/course/mock_ts_1",
      platform: "Udemy",
      author: "Maximilian Schwarzmüller",
      level: "Intermediate",
      resource_type: "course"
    }
  ]
};
```

---

### 3. Component Details: `<MatchesInternshipDetailsModal>`
Implement inside `app/matches/page.tsx` as a sub-component with a Side-by-Side layout:

#### Layout Structure (Desktop):
- Backdrop overlay.
- Central modal card (`max-w-4xl w-11/12 bg-white rounded-2xl flex flex-col md:flex-row overflow-hidden`).
- **Left Column (55% width)**:
  - Header: Job title, company, location, and match score badge.
  - Job description and responsibilities.
  - Skill comparison list (using checkmarks for matching, warning icons for under-leveled, and cross-marks for missing skills).
- **Right Column (45% width)**:
  - Render a background box (`bg-slate-50` or `bg-blue-50/20`).
  - Loading State: An animated loader and text *"🤖 กำลังให้ AI วิเคราะห์ความแตกต่างทักษะ..."* displayed for 1.2 seconds.
  - Loaded State:
    - Display AI's personalized study analysis text in Thai.
    - Render recommended resources corresponding to the gaps (filtered from `MOCK_RESOURCES`).
    - Each resource card lists the platform, title, creator name (`author`), level, and a link button `"เรียนเลย ↗"`.
  - Empty Gaps State: If the match score is 100%, display *"ยินดีด้วย! คุณมีทักษะพร้อม 100% สำหรับตำแหน่งนี้แล้ว 🎉"* instead of recommendations.

---

## Verification & Testing Plan

1. **Routing Verification**: Navigate to `/matches` via the sidebar and verify that it loads the new page successfully.
2. **Card Listings & Sorting**: Verify that internships are listed and correctly sorted by match score (highest first).
3. **Modal Popup Animation**: Verify that clicking a card triggers the modal with a smooth overlay backdrop.
4. **Loading Simulation**: Open the modal and verify that the loading animation displays for 1.2 seconds before the recommendations load.
5. **Dynamic Mock Recommendations**:
   - Test with a student account lacking "React" and "Node.js". Verify that the modal recommends resources specifically for React and Node.js.
   - Verify that the card displays the author/publisher name (e.g., `KongRuksiam Official`, `Stanford University`) and platform.
6. **Responsive Check**: Shrink the viewport to mobile width and verify that the side-by-side split stacks vertically into a single scrollable view.
