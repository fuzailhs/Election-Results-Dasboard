import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("visibly distinguishes a partial result from a final result", () => {
    render(<StatusPill status="Partial" />);
    expect(screen.getByText("Partial")).toHaveClass("status-pill-partial");
  });
});
