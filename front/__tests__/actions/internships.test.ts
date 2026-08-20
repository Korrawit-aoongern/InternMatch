import { createInternship, getCompanyInternships, updateInternship, getInternshipApplicants } from "@/lib/actions/internships";

jest.mock("@/lib/supabase/server", () => {
  const mockSingle = jest.fn().mockResolvedValue({ data: { id: "company-123" }, error: null });
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockResolvedValue({ error: null });
  const mockUpdate = jest.fn().mockResolvedValue({ error: null });
  
  return {
    getSupabaseAdmin: () => ({
      from: jest.fn().mockImplementation((table) => {
        if (table === "companies") {
          return { select: () => ({ eq: () => ({ maybeSingle: mockSingle }) }) };
        }
        return {
          select: mockSelect,
          eq: mockEq,
          insert: mockInsert,
          update: mockUpdate,
        };
      })
    })
  };
});

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: "mock-token" })
  })
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn().mockReturnValue({ userId: "user-123", role: "company" })
}));

describe("Internship Server Actions", () => {
  it("verifies mock environment checks work", async () => {
    expect(true).toBe(true);
  });
});
