import dataset from "../../public/data/election-results.json";
import { describe, expect, it } from "vitest";
import { totalVotes } from "./calculations";
import { validateElectionDataset } from "./validate";

describe("bundled Elections Canada results", () => {
  it("contains the complete official table and excludes its aggregate total row", () => {
    const election = validateElectionDataset(dataset);
    expect(election.areas).toHaveLength(13);
    expect(new Set(election.areas.flatMap((area) => area.results.map((result) => result.partyName))).size).toBe(24);
    expect(totalVotes(election.areas)).toBe(17_034_243);
    expect(election.areas.every((area) => area.results.every((result) => result.partyName !== "Totals"))).toBe(true);
    expect(election.areas.every((area) => area.eligibleVoters === undefined)).toBe(true);
  });
});
