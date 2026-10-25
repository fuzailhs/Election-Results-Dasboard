import type { ElectionArea, ElectionDataset, PartyTotal } from "../types";

export function totalVotes(areas: ElectionArea[]): number {
  return areas.reduce(
    (areaTotal, area) => areaTotal + area.results.reduce((sum, result) => sum + result.votes, 0),
    0,
  );
}

export function summarizeParties(areas: ElectionArea[]): PartyTotal[] {
  const votesByParty = new Map<string, number>();
  for (const area of areas) {
    for (const result of area.results) {
      votesByParty.set(result.partyName, (votesByParty.get(result.partyName) ?? 0) + result.votes);
    }
  }

  const votes = [...votesByParty.values()].reduce((sum, count) => sum + count, 0);
  return [...votesByParty.entries()]
    .map(([partyName, partyVotes]) => ({
      partyName,
      votes: partyVotes,
      share: votes === 0 ? 0 : (partyVotes / votes) * 100,
    }))
    .sort((first, second) => second.votes - first.votes || first.partyName.localeCompare(second.partyName));
}

export function turnoutPercent(area: ElectionArea): number | undefined {
  if (area.eligibleVoters === undefined || area.eligibleVoters === 0) {
    return undefined;
  }
  const votes = totalVotes([area]);
  return (votes / area.eligibleVoters) * 100;
}

export function overallStatus(dataset: ElectionDataset): string {
  const statuses = new Set(dataset.areas.map((area) => area.reportingStatus));
  return statuses.size === 1 ? dataset.areas[0].reportingStatus : "Partial";
}
