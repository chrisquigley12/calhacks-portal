import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LandingPage from "@/app/(portal)/page";
import { APPLICATION_TYPES } from "@/lib/application-types";

describe("LandingPage", () => {
  it("offers the two primary actions: start an application and sign in", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("link", { name: "Start an application" }),
    ).toHaveAttribute("href", "/auth/sign-up");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });

  it("renders one card per application type, each linking to sign-up with that type", () => {
    render(<LandingPage />);

    for (const type of APPLICATION_TYPES) {
      const heading = screen.getByRole("heading", { name: type.label });
      const card = heading.closest("[class*='rounded-lg']") as HTMLElement;
      expect(card).not.toBeNull();

      const applyLink = within(card).getByRole("link", {
        name: `Apply as a ${type.label.toLowerCase()}`,
      });
      expect(applyLink).toHaveAttribute(
        "href",
        `/auth/sign-up?type=${type.value}`,
      );
    }
  });

  it("points organizers at sign-in rather than public sign-up", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("link", { name: "Organizer sign in" }),
    ).toHaveAttribute("href", "/auth/login");
  });
});
