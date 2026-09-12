import { calculateMatchScoreHelper } from "../../utils/match";

describe("calculateMatchScoreHelper", () => {
  it("should return 0 if no internship skills are required", () => {
    const studentSkills = [{ skill_id: 1, level: "Advanced" }];
    const internshipSkills: any[] = [];
    expect(calculateMatchScoreHelper(studentSkills, internshipSkills)).toBe(0);
  });

  it("should return 0 if student has no skills and internship requires some", () => {
    const studentSkills: any[] = [];
    const internshipSkills = [{ skill_id: 1, level: "Intermediate" }];
    expect(calculateMatchScoreHelper(studentSkills, internshipSkills)).toBe(0);
  });

  it("should return 100 for a perfect skill match", () => {
    const studentSkills = [{ skill_id: 1, level: "Intermediate" }];
    const internshipSkills = [{ skill_id: 1, level: "Intermediate" }];
    expect(calculateMatchScoreHelper(studentSkills, internshipSkills)).toBe(100);
  });

  it("should return 100 if student skill level is higher than required", () => {
    const studentSkills = [{ skill_id: 1, level: "Advanced" }];
    const internshipSkills = [{ skill_id: 1, level: "Intermediate" }];
    expect(calculateMatchScoreHelper(studentSkills, internshipSkills)).toBe(100);
  });

  it("should scale down score if student skill level is lower than required", () => {
    // Required: Intermediate (weight 2), Student: Beginner (weight 1).
    // Expected: 1/2 = 50%
    const studentSkills = [{ skill_id: 1, level: "Beginner" }];
    const internshipSkills = [{ skill_id: 1, level: "Intermediate" }];
    expect(calculateMatchScoreHelper(studentSkills, internshipSkills)).toBe(50);
  });

  it("should normalize skill level case insensitively", () => {
    const studentSkills = [{ skill_id: 1, level: "beginner" }];
    const internshipSkills = [{ skill_id: 1, level: "INTERMEDIATE" }];
    expect(calculateMatchScoreHelper(studentSkills, internshipSkills)).toBe(50);
  });
});
