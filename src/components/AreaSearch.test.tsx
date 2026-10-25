import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AreaSearch } from "./AreaSearch";
import type { ElectionArea } from "../types";

const areas: ElectionArea[] = [
  { id: "on", name: "Ont.", reportingStatus: "Final", results: [{ partyName: "Party A", votes: 1 }] },
  { id: "qc", name: "Que.", reportingStatus: "Final", results: [{ partyName: "Party B", votes: 0 }] },
];

describe("AreaSearch", () => {
  it("matches labels case-insensitively and opens the selected area", () => {
    const onSelect = vi.fn();
    render(<AreaSearch areas={areas} onSelect={onSelect} />);
    fireEvent.change(screen.getByLabelText("Search by official area label"), {
      target: { value: "ONT" },
    });
    const searchResult = screen.getAllByRole("button", { name: /Ont\./ })[0];
    expect(searchResult).toBeInTheDocument();
    fireEvent.click(searchResult);
    expect(onSelect).toHaveBeenCalledWith(areas[0]);
  });

  it("shows a clear message when there are no matches", () => {
    render(<AreaSearch areas={areas} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Search by official area label"), {
      target: { value: "Atlantic" },
    });
    expect(screen.getByRole("status")).toHaveTextContent('No areas match “Atlantic”.');
  });

  it("supports keyboard search and focuses the matching result action", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AreaSearch areas={areas} onSelect={onSelect} />);
    await user.tab();
    expect(screen.getByLabelText("Search by official area label")).toHaveFocus();
    await user.keyboard("ONT");
    await user.tab();
    expect(screen.getAllByRole("button", { name: /Ont\./ })[0]).toHaveFocus();
  });
});
