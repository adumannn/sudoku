import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SfxToggle } from "@/components/account/SfxToggle";

vi.mock("@/app/actions/save-sfx-preference", () => ({
  saveSfxPreference: vi.fn(async ({ enabled }: { enabled: boolean }) => ({
    ok: true,
    enabled,
  })),
}));

vi.mock("@/lib/sfx", () => ({
  setSfxEnabled: vi.fn(),
}));

describe("SfxToggle", () => {
  it("keeps the switch track fixed and pads the off thumb evenly", () => {
    render(<SfxToggle initialEnabled={false} />);

    const switchButton = screen.getByRole("switch", {
      name: "sound on solve and number-pad",
    });
    const knob = switchButton.querySelector("span");
    const labelColumn = screen.getByText("sound on solve and number-pad")
      .parentElement;

    expect(labelColumn).toHaveClass("min-w-0");
    expect(switchButton).toHaveClass(
      "inline-flex",
      "w-14",
      "shrink-0",
      "items-center",
      "justify-start",
      "p-1",
    );
    expect(knob).toHaveClass("block", "h-5", "w-5");
    expect(knob).not.toHaveClass("absolute");
  });

  it("pads the enabled thumb evenly without translated pixels", () => {
    render(<SfxToggle initialEnabled />);

    const switchButton = screen.getByRole("switch", {
      name: "sound on solve and number-pad",
    });
    const knob = switchButton.querySelector("span");

    expect(switchButton).toHaveClass("justify-end", "p-1");
    expect(knob).toHaveClass("block", "h-5", "w-5", "bg-bone");
    expect(knob).not.toHaveClass("absolute", "translate-x-7");
  });
});
