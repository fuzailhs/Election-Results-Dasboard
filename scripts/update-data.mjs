import { mkdir, writeFile } from "node:fs/promises";

const sourceUrl = "https://www.elections.ca/res/rep/off/ovr2021app/53/table8E.html";
const outputPath = new URL("../public/data/election-results.json", import.meta.url);
const areaIds = ["nl", "pei", "ns", "nb", "qc", "on", "mb", "sk", "ab", "bc", "yt", "nt", "nu"];
const expectedAreaLabels = [
  "N.L.", "P.E.I.", "N.S.", "N.B.", "Que.", "Ont.", "Man.",
  "Sask.", "Alta.", "B.C.", "Y.T.", "N.W.T.", "Nun.",
];

function decodeHtml(text) {
  const namedEntities = {
    amp: "&",
    apos: "'",
    nbsp: " ",
    quot: '"',
    lt: "<",
    gt: ">",
    eacute: "é",
    Eacute: "É",
    egrave: "è",
    Egrave: "È",
    ecirc: "ê",
    Ecirc: "Ê",
    agrave: "à",
    Agrave: "À",
    ccedil: "ç",
    Ccedil: "Ç",
    rsquo: "’",
  };
  return text
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => namedEntities[name] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

function cellText(markup) {
  return decodeHtml(markup.replace(/<[^>]*>/g, " "));
}

function parseRows(html) {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(([, row]) => [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(([, cell]) => cellText(cell)))
    .filter((cells) => cells.length > 0);
}

function parseVotes(value, partyName, areaLabel) {
  const normalized = value.replaceAll(",", "").trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`Invalid vote count for "${partyName}" in "${areaLabel}": "${value}".`);
  }
  const votes = Number(normalized);
  if (!Number.isSafeInteger(votes)) {
    throw new Error(`Vote count is outside the safe integer range for "${partyName}" in "${areaLabel}".`);
  }
  return votes;
}

const response = await fetch(sourceUrl);
if (!response.ok) {
  throw new Error(`Could not download official results (HTTP ${response.status}).`);
}
const html = await response.text();
const rows = parseRows(html);
const headerIndex = rows.findIndex((row) => row[0] === "Political affiliation");
if (headerIndex < 0) {
  throw new Error("Could not find the political-affiliation header in the official source.");
}

const headers = rows[headerIndex];
if (headers.length !== expectedAreaLabels.length + 2 ||
    !expectedAreaLabels.every((label, index) => headers[index + 1] === label) ||
    headers.at(-1) !== "Total") {
  throw new Error("The official table columns differ from the expected province and territory labels.");
}

const tableRows = [];
for (const row of rows.slice(headerIndex + 1)) {
  if (row.every((cell) => cell.length === 0)) continue;
  tableRows.push(row);
  if (row[0] === "Totals") break;
}
const publishedTotalsRow = tableRows.at(-1);
if (!publishedTotalsRow || publishedTotalsRow[0] !== "Totals") {
  throw new Error("The official results table is missing its published totals row.");
}
for (const [index, row] of tableRows.entries()) {
  if (row.length !== headers.length) {
    throw new Error(`Results row ${index + 1} has ${row.length} columns; expected ${headers.length}.`);
  }
  if (!row[0]) {
    throw new Error(`Results row ${index + 1} is missing its political-affiliation label.`);
  }
}
const sourceRows = tableRows.slice(0, -1);
if (sourceRows.length === 0) {
  throw new Error("The official results table contains no political-affiliation rows.");
}

const areas = expectedAreaLabels.map((name, index) => ({
  id: areaIds[index],
  name,
  reportingStatus: "Final",
  results: [],
}));
const calculatedAreaTotals = expectedAreaLabels.map(() => 0);

for (const row of sourceRows) {
  const partyName = row[0];
  const provinceVotes = row.slice(1, -1);
  const officialTotal = parseVotes(row.at(-1), partyName, "Canada total");
  const calculatedTotal = provinceVotes.reduce(
    (sum, value, index) => sum + parseVotes(value, partyName, expectedAreaLabels[index]),
    0,
  );
  if (calculatedTotal !== officialTotal) {
    throw new Error(`Province and territory counts for "${partyName}" do not match the published Canada total.`);
  }
  provinceVotes.forEach((value, index) => {
    const votes = parseVotes(value, partyName, expectedAreaLabels[index]);
    calculatedAreaTotals[index] += votes;
    areas[index].results.push({
      partyName,
      votes,
    });
  });
}

expectedAreaLabels.forEach((areaLabel, index) => {
  const publishedTotal = parseVotes(publishedTotalsRow[index + 1], "Totals", areaLabel);
  if (calculatedAreaTotals[index] !== publishedTotal) {
    throw new Error(`Affiliation counts for "${areaLabel}" do not match the published area total.`);
  }
});
const calculatedCanadaTotal = calculatedAreaTotals.reduce((sum, votes) => sum + votes, 0);
const publishedCanadaTotal = parseVotes(publishedTotalsRow.at(-1), "Totals", "Canada total");
if (calculatedCanadaTotal !== publishedCanadaTotal) {
  throw new Error("Affiliation counts do not match the published Canada total.");
}

const dataset = {
  name: "44th Canadian General Election",
  date: "2021-09-20",
  status: "Final",
  updatedAt: "2023-10-31",
  sourceName: "Elections Canada — Official Voting Results",
  sourceUrl: "https://www.elections.ca/content.aspx?section=res&dir=rep/off/44gedata&document=index&lang=e",
  areas,
};

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
console.log(`Validated and wrote ${sourceRows.length} affiliations across ${areas.length} areas.`);
