export interface ElectionResult {
  partyName: string;
  candidateName?: string;
  votes: number;
}

export interface ElectionArea {
  id: string;
  name: string;
  eligibleVoters?: number;
  reportingStatus: string;
  results: ElectionResult[];
}

export interface ElectionDataset {
  name: string;
  date: string;
  status: string;
  updatedAt: string;
  sourceName: string;
  sourceUrl: string;
  areas: ElectionArea[];
}

export interface PartyTotal {
  partyName: string;
  votes: number;
  share: number;
}
