import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Save</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick while disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders as a link when asChild wraps an anchor", () => {
    render(
      <Button asChild>
        <a href="/auth/sign-up">Apply</a>
      </Button>,
    );

    // Navigation should stay a real link so it works with the keyboard,
    // middle-click, and screen readers.
    const link = screen.getByRole("link", { name: "Apply" });
    expect(link).toHaveAttribute("href", "/auth/sign-up");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
