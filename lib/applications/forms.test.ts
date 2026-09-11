import { describe, expect, it } from "vitest";

import {
  getFormDefinition,
  parseStoredAnswers,
  readAnswersFromFormData,
  validateAnswers,
  type FormDefinition,
} from "@/lib/applications/forms";

const hackerForm = getFormDefinition("hacker") as FormDefinition;
const volunteerForm = getFormDefinition("volunteer") as FormDefinition;

function fieldNames(form: FormDefinition) {
  return form.fields.map((field) => field.name);
}

describe("getFormDefinition", () => {
  it("gives hackers the hacker questions and volunteers the volunteer questions", () => {
    expect(hackerForm.applicantType).toBe("hacker");
    expect(fieldNames(hackerForm)).toContain("whatToBuild");
    expect(fieldNames(hackerForm)).not.toContain("availability");

    expect(volunteerForm.applicantType).toBe("volunteer");
    expect(fieldNames(volunteerForm)).toContain("availability");
    expect(fieldNames(volunteerForm)).not.toContain("whatToBuild");
  });

  it("has no form for organizers", () => {
    expect(getFormDefinition("organizer")).toBeNull();
  });
});

describe("validateAnswers", () => {
  const completeHackerAnswers = {
    school: "UC Berkeley",
    fieldOfStudy: "Computer Science",
    graduationYear: "2028",
    experienceLevel: "first",
    githubUrl: "",
    whyAttend: "To learn.",
    whatToBuild: "Something useful.",
  };

  it("blocks submission when required fields are empty, but allows a draft", () => {
    const answers = { ...completeHackerAnswers, school: "", whyAttend: "" };

    expect(validateAnswers(hackerForm, answers, "submit")).toEqual({
      school: "This field is required.",
      whyAttend: "This field is required.",
    });
    expect(validateAnswers(hackerForm, answers, "draft")).toEqual({});
  });

  it("accepts a complete application without the optional GitHub URL", () => {
    expect(validateAnswers(hackerForm, completeHackerAnswers, "submit")).toEqual({});
  });

  it("rejects a malformed URL even in a draft", () => {
    const answers = { ...completeHackerAnswers, githubUrl: "github.com/oski" };

    expect(validateAnswers(hackerForm, answers, "draft")).toHaveProperty("githubUrl");
    expect(
      validateAnswers(hackerForm, { ...answers, githubUrl: "https://github.com/oski" }, "draft"),
    ).toEqual({});
  });

  it("rejects select and checkbox values that aren't listed options", () => {
    const answers = {
      school: "UC Berkeley",
      graduationYear: "1999",
      availability: "full-weekend",
      areas: ["check-in", "ceo"],
      priorExperience: "",
      whyVolunteer: "I like helping.",
    };

    const errors = validateAnswers(volunteerForm, answers, "submit");
    expect(errors).toHaveProperty("graduationYear");
    expect(errors).toHaveProperty("areas");
  });
});

describe("readAnswersFromFormData", () => {
  it("reads only the form's fields, trims text, and collects checkbox groups", () => {
    const formData = new FormData();
    formData.append("school", "  UC Berkeley ");
    formData.append("areas", "check-in");
    formData.append("areas", "food");
    formData.append("user_id", "someone-else"); // must be ignored

    const answers = readAnswersFromFormData(volunteerForm, formData);

    expect(answers.school).toBe("UC Berkeley");
    expect(answers.areas).toEqual(["check-in", "food"]);
    expect(answers).not.toHaveProperty("user_id");
  });
});

describe("parseStoredAnswers", () => {
  it("narrows arbitrary JSON to the form's shape", () => {
    const answers = parseStoredAnswers(volunteerForm, {
      school: "UC Berkeley",
      areas: ["food", 42, null],
      availability: { nested: true },
      extra: "ignored",
    });

    expect(answers.school).toBe("UC Berkeley");
    expect(answers.areas).toEqual(["food"]);
    expect(answers.availability).toBe("");
    expect(answers).not.toHaveProperty("extra");
  });

  it("returns empty values when there is no stored application", () => {
    expect(parseStoredAnswers(hackerForm, null).school).toBe("");
  });
});
