import { describe, expect, it } from "vitest";
import { summarizeParties, totalVotes, turnoutPercent } from "./calculations";
import { validateElectionDataset } from "./validate";
import type { ElectionArea } from "../types";

const areas: ElectionArea[] = [
  {
    id: "north",
    name: "North",
    eligibleVoters: 10,
    reportingStatus: "Partial",
    results: [
      { partyName: "Beta", votes: 4 },
      { partyName: "Alpha", votes: 4 },
      { partyName: "Zero", votes: 0 },
    ],
  },
  {
    id: "south",
    name: "South",
    reportingStatus: "Final",
    results: [
      { partyName: "Beta", votes: 2 },
      { partyName: "Alpha", votes: 0 },
    ],
  },
];

describe("election calculations", () => {
  it("sums votes and shares without losing zero-valued parties", () => {
    expect(totalVotes(areas)).toBe(10);
    expect(summarizeParties(areas)).toEqual([
      { partyName: "Beta", votes: 6, share: 60 },
      { partyName: "Alpha", votes: 4, share: 40 },
      { partyName: "Zero", votes: 0, share: 0 },
    ]);
  });

  it("calculates turnout only when an eligible-voter denominator exists", () => {
    expect(turnoutPercent(areas[0])).toBe(80);
    expect(turnoutPercent(areas[1])).toBeUndefined();
  });

  it("keeps tied counts tied and sorts their labels alphabetically", () => {
    const tied = summarizeParties([{
      id: "tie",
      name: "Tie",
      reportingStatus: "Final",
      results: [{ partyName: "Zulu", votes: 5 }, { partyName: "Alpha", votes: 5 }],
    }]);
    expect(tied.map(({ partyName, votes }) => [partyName, votes])).toEqual([
      ["Alpha", 5],
      ["Zulu", 5],
    ]);
  });
});

describe("dataset validation", () => {
  it("rejects duplicate area IDs, duplicate party rows, and invalid votes", () => {
    const valid = {
      name: "Test election",
      date: "2021-01-01",
      status: "Final",
      updatedAt: "2021-01-02",
      sourceName: "Official source",
      sourceUrl: "https://example.test/source",
      areas: [{
        id: "a",
        name: "Area A",
        reportingStatus: "Final",
        results: [{ partyName: "Party", votes: 1 }],
      }],
    };
    expect(validateElectionDataset(valid).areas).toHaveLength(1);
    expect(() => validateElectionDataset({ ...valid, areas: [...valid.areas, valid.areas[0]] })).toThrow(/duplicated/);
    expect(() => validateElectionDataset({
      ...valid,
      areas: [{ ...valid.areas[0], results: [{ partyName: "Party", votes: -1 }] }],
    })).toThrow(/invalid vote count/);
    expect(() => validateElectionDataset({
      ...valid,
      areas: [{ ...valid.areas[0], results: [valid.areas[0].results[0], valid.areas[0].results[0]] }],
    })).toThrow(/duplicated/);
  });

  it("accepts an empty area list so the interface can show a distinct no-data state", () => {
    const empty = {
      name: "Test election",
      date: "2021-01-01",
      status: "Final",
      updatedAt: "2021-01-02",
      sourceName: "Official source",
      sourceUrl: "https://example.test/source",
      areas: [],
    };
    expect(validateElectionDataset(empty).areas).toEqual([]);
  });
});
