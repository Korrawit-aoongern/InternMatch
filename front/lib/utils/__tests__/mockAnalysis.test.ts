import { generateMockAiUpskilling } from "../mockAnalysis";

describe("generateMockAiUpskilling", () => {
  const studentSkills = [
    { skill_id: 1, level: "Beginner" }, // e.g. React
    { skill_id: 3, level: "Advanced" }  // e.g. CSS
  ];
  
  const internshipSkills = [
    { skill_id: 1, level: "Advanced", skills: { id: 1, name: "React" } },
    { skill_id: 2, level: "Intermediate", skills: { id: 2, name: "Node.js" } },
    { skill_id: 3, level: "Beginner", skills: { id: 3, name: "CSS" } }
  ];

  it("should correctly identify missing and under-leveled skills and match courses", () => {
    const result = generateMockAiUpskilling(studentSkills, internshipSkills, "Software Engineer");
    
    expect(result.hasGaps).toBe(true);
    expect(result.analysisText).toContain("React");
    expect(result.analysisText).toContain("Node.js");
    expect(result.recommendedCourses.length).toBeGreaterThan(0);
    
    // Check resource schema structure
    const course = result.recommendedCourses[0];
    expect(course).toHaveProperty("platform");
    expect(course).toHaveProperty("author");
    expect(course).toHaveProperty("url");
  });

  it("should return friendly success message and empty course list if no gaps exist", () => {
    const perfectStudentSkills = [
      { skill_id: 1, level: "Advanced" },
      { skill_id: 2, level: "Advanced" },
      { skill_id: 3, level: "Advanced" }
    ];
    const result = generateMockAiUpskilling(perfectStudentSkills, internshipSkills, "Software Engineer");
    
    expect(result.hasGaps).toBe(false);
    expect(result.analysisText).toContain("100%");
    expect(result.recommendedCourses.length).toBe(0);
  });
});
