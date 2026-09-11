import { beforeEach, describe, expect, it, vi } from "vitest";

import { reviewApplicationAction } from "@/app/(portal)/organizer/applications/[id]/actions";
import { INITIAL_REVIEW_STATE } from "@/lib/organizer/review-state";

// The organizer guard and the Supabase client are the two boundaries this
// action talks to. Everything between them (parsing, RPC arguments, result
// handling) runs for real.
const requireOrganizer = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/auth/require-organizer", () => ({
  requireOrganizer: () => requireOrganizer(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function formDataFrom(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.append(key, value);
  return formData;
}

describe("reviewApplicationAction", () => {
  beforeEach(() => {
    requireOrganizer.mockReset().mockResolvedValue({ account_type: "organizer" });
    rpc.mockReset().mockResolvedValue({ data: null, error: null });
  });

  it("sends exactly the bound application id, outcome, score, and notes to the RPC", async () => {
    const result = await reviewApplicationAction(
      "app-1",
      INITIAL_REVIEW_STATE,
      formDataFrom({
        status: "accepted",
        score: "8",
        notes: "Strong application",
        // Anything applicant-owned that a tampered form might include:
        responses: '{"school":"x"}',
        application_id: "someone-elses-app",
      }),
    );

    expect(requireOrganizer).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("review_application", {
      application_id: "app-1",
      new_status: "accepted",
      new_score: 8,
      new_notes: "Strong application",
    });
    expect(result.status).toBe("saved");
    expect(result.message).toBe("Review saved.");
  });

  it("rejects an invalid score before touching the database", async () => {
    const result = await reviewApplicationAction(
      "app-1",
      INITIAL_REVIEW_STATE,
      formDataFrom({ status: "reviewed", score: "11", notes: "" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toHaveProperty("score");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects 'submitted' as an outcome", async () => {
    const result = await reviewApplicationAction(
      "app-1",
      INITIAL_REVIEW_STATE,
      formDataFrom({ status: "submitted", score: "8", notes: "" }),
    );

    expect(result.fieldErrors).toHaveProperty("status");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns the database's error message when the RPC refuses", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Only organizers can review applications" } });

    const result = await reviewApplicationAction(
      "app-1",
      INITIAL_REVIEW_STATE,
      formDataFrom({ status: "reviewed", score: "", notes: "" }),
    );

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/Only organizers/);
  });
});
