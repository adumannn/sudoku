import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Cell, type CellProps } from "@/components/game/Cell";

const baseProps: CellProps = {
  index: 0,
  value: 0,
  given: false,
  selected: false,
  peer: false,
  sameVal: false,
  conflict: false,
  onSelect: vi.fn(),
};

function renderCell(overrides: Partial<CellProps> = {}) {
  return render(<Cell {...baseProps} {...overrides} />);
}

describe("Cell placement ink", () => {
  it("adds .ink-place when a player cell changes from empty to digit", () => {
    const { rerender } = renderCell({ value: 0 });

    rerender(<Cell {...baseProps} value={5} />);

    expect(screen.getByRole("button", { name: "cell-0 5" })).toHaveClass(
      "ink-place",
    );
  });

  it("removes .ink-place on the cell animation end", () => {
    const { rerender } = renderCell({ value: 0 });
    rerender(<Cell {...baseProps} value={5} />);

    const cell = screen.getByRole("button", { name: "cell-0 5" });
    fireEvent(cell, new Event("webkitAnimationEnd", { bubbles: true }));

    expect(cell).not.toHaveClass("ink-place");
  });

  it("does not add .ink-place when a player digit is erased", () => {
    const { rerender } = renderCell({ value: 5 });

    rerender(<Cell {...baseProps} value={0} />);

    expect(screen.getByRole("button", { name: "cell-0 empty" })).not.toHaveClass(
      "ink-place",
    );
  });

  it("does not add .ink-place for given cells", () => {
    const { rerender } = renderCell({ value: 0, given: true });

    rerender(<Cell {...baseProps} value={5} given />);

    expect(screen.getByRole("button", { name: "cell-0 5" })).not.toHaveClass(
      "ink-place",
    );
  });
});
