import { describe, expect, it } from "vitest";

import { parsePublicAccountType, PUBLIC_ACCOUNT_TYPES } from "@/lib/account-types";

describe("parsePublicAccountType", () => {
  it("accepts each public account type", () => {
    expect(parsePublicAccountType("hacker")).toBe("hacker");
    expect(parsePublicAccountType("volunteer")).toBe("volunteer");
  });

  it("tolerates casing and surrounding whitespace from query strings", () => {
    expect(parsePublicAccountType(" Volunteer ")).toBe("volunteer");
  });

  it("rejects organizer so it can never be self-assigned", () => {
    expect(parsePublicAccountType("organizer")).toBeNull();
    expect(PUBLIC_ACCOUNT_TYPES).not.toContain("organizer");
  });

  it("rejects unknown and non-string values", () => {
    expect(parsePublicAccountType("mentor")).toBeNull();
    expect(parsePublicAccountType("")).toBeNull();
    expect(parsePublicAccountType(undefined)).toBeNull();
    expect(parsePublicAccountType(42)).toBeNull();
    expect(parsePublicAccountType({ value: "hacker" })).toBeNull();
  });
});
