import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Select } from "@/components/ui/select";
import { APPLICATION_TYPES } from "@/lib/application-types";

describe("Select", () => {
  it("renders the given options and reports the chosen value", async () => {
    const handleChange = vi.fn();
    render(
      <Select aria-label="Application type" defaultValue="" onChange={handleChange}>
        <option value="" disabled>
          Choose a type
        </option>
        {APPLICATION_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </Select>,
    );

    const select = screen.getByRole("combobox", { name: "Application type" });
    await userEvent.selectOptions(select, "volunteer");

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(select).toHaveValue("volunteer");
    expect(screen.getByRole("option", { name: "Hacker" })).toBeInTheDocument();
  });
});
