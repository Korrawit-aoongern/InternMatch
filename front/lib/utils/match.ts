export interface SkillInfo {
  skill_id: number | string;
  level?: string;
}

export const LEVEL_MAP: Record<string, number> = {
  "beginner": 1,
  "intermediate": 2,
  "advanced": 3
};

export function calculateMatchScoreHelper(
  studentSkills: SkillInfo[] | null | undefined,
  internshipSkills: SkillInfo[] | null | undefined
): number {
  const sSkills = studentSkills || [];
  const reqSkills = internshipSkills || [];
  const requiredSkillsCount = reqSkills.length;
  if (requiredSkillsCount === 0) return 100;

  let matchScoreSum = 0;

  reqSkills.forEach((is: SkillInfo) => {
    const skillId = Number(is.skill_id);
    const requiredLevelStr = (is.level || "Intermediate").toLowerCase();
    const requiredLevel = LEVEL_MAP[requiredLevelStr] || 2; // Default to Intermediate

    // Find if student has this skill
    const studentSkill = sSkills.find((s: SkillInfo) => Number(s.skill_id) === skillId);

    if (studentSkill) {
      const studentLevelStr = (studentSkill.level || "Intermediate").toLowerCase();
      const studentLevel = LEVEL_MAP[studentLevelStr] || 2;

      if (studentLevel >= requiredLevel) {
        matchScoreSum += 1.0;
      } else {
        // Scale down the score contribution
        matchScoreSum += studentLevel / requiredLevel;
      }
    }
  });

  return Math.round((matchScoreSum / requiredSkillsCount) * 100);
}
