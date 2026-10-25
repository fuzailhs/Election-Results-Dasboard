import type { ElectionArea, ElectionDataset, ElectionResult } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

function requireString(value: unknown, label: string): string {
  if (!isNonEmptyString(value)) {
    throw new Error(`Election data is missing required field "${label}".`);
  }
  return value;
}

export function validateElectionDataset(value: unknown): ElectionDataset {
  if (!isRecord(value)) {
    throw new Error("The election data must be a JSON object.");
  }

  const name = requireString(value.name, "name");
  const date = requireString(value.date, "date");
  const status = requireString(value.status, "status");
  const updatedAt = requireString(value.updatedAt, "updatedAt");
  const sourceName = requireString(value.sourceName, "sourceName");
  const sourceUrl = requireString(value.sourceUrl, "sourceUrl");
  let parsedSourceUrl: URL;
  try {
    parsedSourceUrl = new URL(sourceUrl);
  } catch {
    throw new Error('Election data field "sourceUrl" must be a valid HTTPS URL.');
  }
  if (parsedSourceUrl.protocol !== "https:") {
    throw new Error('Election data field "sourceUrl" must be a valid HTTPS URL.');
  }

  if (!Array.isArray(value.areas)) {
    throw new Error("Election data must contain an areas array.");
  }

  const areaIds = new Set<string>();
  const areas: ElectionArea[] = [];
  for (const [areaIndex, areaValue] of value.areas.entries()) {
    if (!isRecord(areaValue)) {
      throw new Error(`Area ${areaIndex + 1} must be an object.`);
    }
    const id = requireString(areaValue.id, `areas[${areaIndex}].id`);
    const areaName = requireString(areaValue.name, `areas[${areaIndex}].name`);
    if (areaIds.has(id)) {
      throw new Error(`Area ID "${id}" is duplicated.`);
    }
    areaIds.add(id);

    const reportingStatus = requireString(areaValue.reportingStatus, `areas[${areaIndex}].reportingStatus`);
    if (areaValue.eligibleVoters !== undefined && !isNonNegativeInteger(areaValue.eligibleVoters)) {
      throw new Error(`Area "${areaName}" has an invalid eligible-voter count.`);
    }
    if (!Array.isArray(areaValue.results)) {
      throw new Error(`Area "${areaName}" must contain a results array.`);
    }

    const partyNames = new Set<string>();
    const results: ElectionResult[] = [];
    for (const [resultIndex, resultValue] of areaValue.results.entries()) {
      if (!isRecord(resultValue)) {
        throw new Error(`Result ${resultIndex + 1} in area "${areaName}" must be an object.`);
      }
      const partyName = requireString(resultValue.partyName, `areas[${areaIndex}].results[${resultIndex}].partyName`);
      if (partyNames.has(partyName)) {
        throw new Error(`Party "${partyName}" is duplicated in area "${areaName}".`);
      }
      partyNames.add(partyName);
      if (!isNonNegativeInteger(resultValue.votes)) {
        throw new Error(`Party "${partyName}" in area "${areaName}" has an invalid vote count.`);
      }
      if (resultValue.candidateName !== undefined && !isNonEmptyString(resultValue.candidateName)) {
        throw new Error(`Party "${partyName}" in area "${areaName}" has an invalid candidate name.`);
      }
      results.push({
        partyName,
        ...(resultValue.candidateName === undefined ? {} : { candidateName: resultValue.candidateName }),
        votes: resultValue.votes,
      });
    }

    areas.push({
      id,
      name: areaName,
      ...(areaValue.eligibleVoters === undefined ? {} : { eligibleVoters: areaValue.eligibleVoters }),
      reportingStatus,
      results,
    });
  }

  return {
    name,
    date,
    status,
    updatedAt,
    sourceName,
    sourceUrl,
    areas,
  };
}
