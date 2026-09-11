import { describe, expect, it } from "vitest";

import { parseReviewInput } from "@/lib/organizer/review";

function formDataFrom(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return formData;
}

describe("parseReviewInput", () => {
  it("accepts a valid status, score, and notes", () => {
    const { input, errors } = parseReviewInput(
      formDataFrom({ status: "accepted", score: "8", notes: "  Strong project history. " }),
    );

    expect(errors).toEqual({});
    expect(input).toEqual({ status: "accepted", score: 8, notes: "Strong project history." });
  });

  it("allows an empty score while a review is in progress", () => {
    const { input } = parseReviewInput(formDataFrom({ status: "reviewed", score: "", notes: "" }));
    expect(input?.score).toBeNull();
  });

  it("rejects scores outside 1–10 and non-integers", () => {
    expect(parseReviewInput(formDataFrom({ status: "reviewed", score: "0" })).errors).toHaveProperty("score");
    expect(parseReviewInput(formDataFrom({ status: "reviewed", score: "11" })).errors).toHaveProperty("score");
    expect(parseReviewInput(formDataFrom({ status: "reviewed", score: "7.5" })).errors).toHaveProperty("score");
  });

  it("rejects statuses organizers may not set, including draft", () => {
    expect(parseReviewInput(formDataFrom({ status: "draft", score: "5" })).errors).toHaveProperty("status");
    expect(parseReviewInput(formDataFrom({ status: "waitlisted", score: "5" })).errors).toHaveProperty("status");
  });
});
