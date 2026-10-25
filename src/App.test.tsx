import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import dataset from "../public/data/election-results.json";

function successfulResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  };
}

describe("dashboard routes and states", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successfulResponse(dataset)));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("restores two valid areas from the comparison URL", async () => {
    window.history.replaceState({}, "", "/compare?a=on&b=qc");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Compare reported results" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ont." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Que." })).toBeInTheDocument();
    expect(screen.getByLabelText("First area")).toHaveValue("on");
    expect(screen.getByLabelText("Second area")).toHaveValue("qc");
    expect(screen.getByRole("link", { name: "Data source ↗" })).toHaveAttribute(
      "href",
      dataset.sourceUrl,
    );
  });

  it("encodes chosen area IDs into a shareable comparison URL", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: /Results, made/ });
    fireEvent.click(
      within(screen.getByRole("navigation", { name: "Main navigation" })).getByRole("link", {
        name: "Compare areas",
      }),
    );
    fireEvent.change(await screen.findByLabelText("First area"), { target: { value: "on" } });
    fireEvent.change(screen.getByLabelText("Second area"), { target: { value: "qc" } });
    fireEvent.click(screen.getByRole("button", { name: /Compare results/ }));
    expect(await screen.findByRole("heading", { name: "Compare reported results" })).toBeInTheDocument();
    expect(window.location.search).toBe("?a=on&b=qc");
  });

  it("opens an area detail route and displays that area's official status", async () => {
    window.history.replaceState({}, "", "/area/on");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Ont." })).toBeInTheDocument();
    expect(screen.getByText("Published official result")).toBeInTheDocument();
  });

  it("shows a separate no-data state for an empty but valid dataset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(successfulResponse({ ...dataset, areas: [] })),
    );
    render(<App />);
    expect(await screen.findByRole("heading", { name: "No election data is available." })).toBeInTheDocument();
  });

  it("shows a load error without calculated results when loading fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network unavailable.")));
    render(<App />);
    expect(await screen.findByRole("heading", { name: "We couldn’t load the election data." })).toBeInTheDocument();
    expect(screen.getByText("No calculated results are shown until the data can be validated.")).toBeInTheDocument();
  });
});
