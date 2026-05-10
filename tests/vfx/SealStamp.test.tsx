import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SealStamp } from "@/lib/vfx/SealStamp";

describe("SealStamp", () => {
  it("mounts with the solve stamp class", async () => {
    render(<SealStamp kanji="桜" />);

    const stamp = screen.getByLabelText("seal 桜");
    expect(stamp).toHaveClass("seal-stamp-vfx");
    expect(stamp).toHaveTextContent("桜");
    expect(stamp).toHaveAttribute("aria-live", "polite");

    await waitFor(() => {
      expect(stamp).toHaveClass("seal-stamp-vfx-mounted");
    });
  });

  it("renders aria-live off when requested", () => {
    render(<SealStamp kanji="完" ariaLive="off" />);

    expect(screen.getByLabelText("seal 完")).toHaveAttribute(
      "aria-live",
      "off",
    );
  });
});
