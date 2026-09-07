import { getAiSkillRecommendations } from "../geminiRecommendations";

describe("getAiSkillRecommendations", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return early when student has 100% matching skills with no gaps", async () => {
    const studentSkills = [
      { skill_id: 1, name: "React", level: "Advanced" },
      { skill_id: 2, name: "Node.js", level: "Intermediate" },
    ];

    const internshipSkills = [
      { skill_id: 1, name: "React", level: "Advanced" },
      { skill_id: 2, name: "Node.js", level: "Beginner" },
    ];

    const result = await getAiSkillRecommendations(
      "Senior Fullstack Intern",
      "Building web applications",
      internshipSkills,
      studentSkills
    );

    expect(result.success).toBe(true);
    expect(result.hasGaps).toBe(false);
    expect(result.analysisText).toContain("100%");
    expect(result.recommendations).toHaveLength(0);
  });

  it("should gracefully fallback to curated resources when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const studentSkills = [
      { skill_id: 3, name: "CSS", level: "Beginner" },
    ];

    const internshipSkills = [
      { skill_id: 1, name: "React", level: "Advanced" },
      { skill_id: 2, name: "Node.js", level: "Intermediate" },
    ];

    const result = await getAiSkillRecommendations(
      "Frontend Developer Intern",
      "React development",
      internshipSkills,
      studentSkills
    );

    expect(result.success).toBe(true);
    expect(result.hasGaps).toBe(true);
    expect(result.provider).toBe("fallback");
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]).toHaveProperty("title");
    expect(result.recommendations[0]).toHaveProperty("platform");
  });

  it("should parse and return Gemini API results when API call succeeds", async () => {
    process.env.GEMINI_API_KEY = "mock-key-123";

    const mockApiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  analysisText: "บทวิเคราะห์จาก Gemini: แนะนำให้เริ่มเรียน React ก่อนเพื่อปิดจุดอ่อน",
                  recommendations: [
                    {
                      id: "g1",
                      title: "React 19 Crash Course",
                      url: "https://www.youtube.com/watch?v=mock_react",
                      platform: "YouTube",
                      author: "KongRuksiam",
                      level: "Beginner",
                      resource_type: "video",
                      targetSkill: "React",
                      reason: "เนื้อหาเข้าใจง่ายและปูพื้นฐานได้ดี",
                    },
                  ],
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockApiResponse),
    } as any);

    const studentSkills = [{ skill_id: 3, name: "CSS", level: "Beginner" }];
    const internshipSkills = [{ skill_id: 1, name: "React", level: "Advanced" }];

    const result = await getAiSkillRecommendations(
      "Frontend Intern",
      "Description",
      internshipSkills,
      studentSkills
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBe("gemini");
    expect(result.analysisText).toContain("บทวิเคราะห์จาก Gemini");
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].title).toBe("React 19 Crash Course");
    expect(result.recommendations[0].author).toBe("KongRuksiam");
  });

  it("should fallback gracefully if Gemini API throws an error", async () => {
    process.env.GEMINI_API_KEY = "mock-key-123";

    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const studentSkills = [{ skill_id: 3, name: "CSS", level: "Beginner" }];
    const internshipSkills = [{ skill_id: 1, name: "React", level: "Advanced" }];

    const result = await getAiSkillRecommendations(
      "Frontend Intern",
      "Description",
      internshipSkills,
      studentSkills
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBe("fallback");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
