import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AreaSearch } from "./components/AreaSearch";
import { PartyResults } from "./components/PartyResults";
import { StatusPill } from "./components/StatusPill";
import { formatDate, formatNumber, formatPercent } from "./format";
import { overallStatus, summarizeParties, totalVotes, turnoutPercent } from "./data/calculations";
import { validateElectionDataset } from "./data/validate";
import type { ElectionArea, ElectionDataset } from "./types";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; dataset: ElectionDataset }
  | { status: "error"; message: string };

function useAppLocation() {
  const [location, setLocation] = useState(() => `${window.location.pathname}${window.location.search}`);

  useEffect(() => {
    const update = () => setLocation(`${window.location.pathname}${window.location.search}`);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, "", path);
    setLocation(`${window.location.pathname}${window.location.search}`);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return { location, navigate };
}

function AppLink({
  href,
  navigate,
  children,
  className,
  ariaLabel,
  current,
}: {
  href: string;
  navigate: (path: string) => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  current?: boolean;
}) {
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      aria-current={current ? "page" : undefined}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

function Header({
  dataset,
  location,
  navigate,
}: {
  dataset?: ElectionDataset;
  location: string;
  navigate: (path: string) => void;
}) {
  const activePath = location.split("?")[0];
  return (
    <header className="site-header">
      <div className="header-inner">
        <AppLink href="/" navigate={navigate} className="brand" ariaLabel="Election Results Dashboard home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-copy">
            <strong>Public Ledger</strong>
            <small>Election results, clearly.</small>
          </span>
        </AppLink>
        <nav className="primary-nav" aria-label="Main navigation">
          <AppLink
            href="/"
            navigate={navigate}
            className={activePath === "/" ? "nav-link active" : "nav-link"}
            current={activePath === "/"}
          >
            Overview
          </AppLink>
          <AppLink
            href="/compare"
            navigate={navigate}
            className={activePath === "/compare" ? "nav-link active" : "nav-link"}
            current={activePath === "/compare"}
          >
            Compare areas
          </AppLink>
          <AppLink
            href="/methodology"
            navigate={navigate}
            className={activePath === "/methodology" ? "nav-link active" : "nav-link"}
            current={activePath === "/methodology"}
          >
            Source &amp; methodology
          </AppLink>
        </nav>
        <div className="header-source">
          <span className="source-indicator" aria-hidden="true" />
          <span>{dataset ? `Updated ${formatDate(dataset.updatedAt)}` : "Official public data"}</span>
        </div>
      </div>
    </header>
  );
}

function SiteFooter({ dataset, navigate }: { dataset?: ElectionDataset; navigate: (path: string) => void }) {
  return (
    <footer className="site-footer">
      <div>
        <strong>Public Ledger</strong>
        <p>Independent, read-only exploration of published election results.</p>
      </div>
      <div className="footer-links">
        {dataset && (
          <a href={dataset.sourceUrl} target="_blank" rel="noreferrer">
            Data source ↗
          </a>
        )}
        <AppLink href="/methodology" navigate={navigate}>Source &amp; methodology</AppLink>
      </div>
      <p className="footer-caveat">Informational only. Not an official reporting system.</p>
    </footer>
  );
}

function PageFrame({
  children,
  dataset,
  navigate,
}: {
  children: ReactNode;
  dataset?: ElectionDataset;
  navigate: (path: string) => void;
}) {
  return (
    <>
      <main className="page-main">{children}</main>
      <SiteFooter dataset={dataset} navigate={navigate} />
    </>
  );
}

function SummaryCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="summary-card">
      <span className="summary-label">{label}</span>
      <strong>{value}</strong>
      <span className="summary-note">{note}</span>
    </div>
  );
}

function OverviewPage({
  dataset,
  navigate,
}: {
  dataset: ElectionDataset;
  navigate: (path: string) => void;
}) {
  const parties = useMemo(() => summarizeParties(dataset.areas), [dataset.areas]);
  const electionTotal = totalVotes(dataset.areas);

  return (
    <PageFrame dataset={dataset} navigate={navigate}>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">CANADA · FEDERAL ELECTION · 2021</p>
          <h1>Results, made<br /><span>understandable.</span></h1>
          <p className="hero-description">
            Explore the official 44th General Election results by political affiliation and province or territory.
            Neutral, traceable, and open to everyone.
          </p>
          <div className="hero-meta">
            <StatusPill status={overallStatus(dataset)} />
            <span className="meta-separator" aria-hidden="true">·</span>
            <span>Election day {formatDate(dataset.date)}</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-stamp">
            <span>44</span>
            <small>GENERAL<br />ELECTION</small>
            <i />
          </div>
          <span className="visual-label visual-label-top">OFFICIAL RESULTS</span>
          <span className="visual-label visual-label-bottom">CANADA · 2021</span>
        </div>
      </section>

      <section className="summary-grid" aria-label="Election summary">
        <SummaryCard label="Valid votes" value={formatNumber(electionTotal)} note="Across all provinces & territories" />
        <SummaryCard label="Areas reported" value={formatNumber(dataset.areas.length)} note="Province and territory totals" />
        <SummaryCard label="Election date" value={formatDate(dataset.date)} note={dataset.name} />
        <SummaryCard label="Voter turnout" value="Not provided" note="No eligible-voter denominator in this table" />
      </section>

      <div className="content-grid overview-grid">
        <PartyResults parties={parties} title="National party results" />
        <AreaSearch
          areas={dataset.areas}
          onSelect={(area) => navigate(`/area/${encodeURIComponent(area.id)}`)}
        />
      </div>

      <section className="compare-callout">
        <div className="callout-icon" aria-hidden="true">↔</div>
        <div>
          <p className="eyebrow">Put two areas side by side</p>
          <h2>See how results differ across regions.</h2>
        </div>
        <AppLink href="/compare" navigate={navigate} className="button button-dark">
          Compare areas <span aria-hidden="true">→</span>
        </AppLink>
      </section>
    </PageFrame>
  );
}

function AreaPage({
  area,
  dataset,
  navigate,
}: {
  area: ElectionArea;
  dataset: ElectionDataset;
  navigate: (path: string) => void;
}) {
  const parties = useMemo(
    () =>
      [...area.results]
        .map((result) => ({
          partyName: result.partyName,
          votes: result.votes,
          share: totalVotes([area]) === 0 ? 0 : (result.votes / totalVotes([area])) * 100,
        }))
        .sort((first, second) => second.votes - first.votes || first.partyName.localeCompare(second.partyName)),
    [area],
  );
  const total = totalVotes([area]);
  const turnout = turnoutPercent(area);

  return (
    <PageFrame dataset={dataset} navigate={navigate}>
      <div className="breadcrumb">
        <AppLink href="/" navigate={navigate}>Overview</AppLink>
        <span aria-hidden="true">/</span>
        <span>{area.name}</span>
      </div>
      <section className="page-heading">
        <div>
          <p className="eyebrow">AREA RESULTS · {dataset.name.toLocaleUpperCase()}</p>
          <h1>{area.name}</h1>
          <p className="page-intro">Official party vote totals for this area, as published by Elections Canada.</p>
        </div>
        <StatusPill status={area.reportingStatus} />
      </section>
      <section className="summary-grid detail-summary" aria-label={`${area.name} summary`}>
        <SummaryCard label="Valid votes" value={formatNumber(total)} note="Sum of reported party votes" />
        <SummaryCard label="Reporting status" value={area.reportingStatus} note="Published official result" />
        <SummaryCard
          label="Voter turnout"
          value={turnout === undefined ? "Not provided" : formatPercent(turnout)}
          note={turnout === undefined ? "No eligible-voter denominator in this table" : "Valid votes ÷ eligible voters"}
        />
      </section>
      <PartyResults parties={parties} title={`${area.name} party results`} />
      <div className="inline-note">
        <span className="note-mark" aria-hidden="true">i</span>
        <p>Candidate-level results and candidate names are not included in the selected official summary table.</p>
      </div>
      <div className="detail-actions">
        <AppLink href="/compare" navigate={navigate} className="button button-dark">
          Compare areas <span aria-hidden="true">→</span>
        </AppLink>
      </div>
    </PageFrame>
  );
}

function ComparePage({
  dataset,
  navigate,
  location,
}: {
  dataset: ElectionDataset;
  navigate: (path: string) => void;
  location: string;
}) {
  const areas = dataset.areas;
  const query = new URLSearchParams(location.split("?")[1] ?? "");
  const areaA = areas.find((area) => area.id === query.get("a"));
  const areaB = areas.find((area) => area.id === query.get("b"));
  const [firstId, setFirstId] = useState(areaA?.id ?? areas[0]?.id ?? "");
  const [secondId, setSecondId] = useState(areaB?.id ?? areas[1]?.id ?? "");
  const [message, setMessage] = useState("");
  const validSelection = areaA && areaB && areaA.id !== areaB.id;

  useEffect(() => {
    setFirstId(areaA?.id ?? areas[0]?.id ?? "");
    setSecondId(areaB?.id ?? areas[1]?.id ?? "");
    setMessage("");
  }, [areaA?.id, areaB?.id, areas]);

  const compare = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firstId || !secondId) {
      setMessage("Choose two areas to compare.");
      return;
    }
    if (firstId === secondId) {
      setMessage("Choose two different areas.");
      return;
    }
    setMessage("");
    navigate(`/compare?a=${encodeURIComponent(firstId)}&b=${encodeURIComponent(secondId)}`);
  };

  const comparisonRows = useMemo(() => {
    if (!areaA || !areaB) return [];
    const byArea = (area: ElectionArea) =>
      new Map(
        summarizeParties([area]).map((party) => [party.partyName, party]),
      );
    const firstParties = byArea(areaA);
    const secondParties = byArea(areaB);
    const names = new Set([...firstParties.keys(), ...secondParties.keys()]);
    return [...names]
      .map((partyName) => ({
        partyName,
        first: firstParties.get(partyName),
        second: secondParties.get(partyName),
      }))
      .sort((first, second) =>
        (second.first?.votes ?? second.second?.votes ?? 0) -
          (first.first?.votes ?? first.second?.votes ?? 0) ||
        first.partyName.localeCompare(second.partyName),
      );
  }, [areaA, areaB]);

  return (
    <PageFrame dataset={dataset} navigate={navigate}>
      <p className="eyebrow">COMPARE RESULTS</p>
      <section className="page-heading compact-heading">
        <div>
          <h1>Two areas, side by side.</h1>
          <p className="page-intro">Compare valid-vote totals and party shares using the same source and calculation rules.</p>
        </div>
      </section>
      <form className="compare-form panel" onSubmit={compare}>
        <div className="select-field">
          <label className="field-label" htmlFor="compare-area-a">First area</label>
          <select id="compare-area-a" value={firstId} onChange={(event) => setFirstId(event.target.value)}>
            {areas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}
          </select>
        </div>
        <span className="compare-symbol" aria-hidden="true">↔</span>
        <div className="select-field">
          <label className="field-label" htmlFor="compare-area-b">Second area</label>
          <select id="compare-area-b" value={secondId} onChange={(event) => setSecondId(event.target.value)}>
            {areas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}
          </select>
        </div>
        <button className="button button-dark compare-submit" type="submit">Compare results <span aria-hidden="true">→</span></button>
        {message && <p className="form-message" role="alert">{message}</p>}
      </form>

      {validSelection && areaA && areaB ? (
        <>
          <div className="comparison-header">
            {[areaA, areaB].map((area) => (
              <div className="comparison-area" key={area.id}>
                <span className="comparison-label">AREA</span>
                <h2>{area.name}</h2>
                <StatusPill status={area.reportingStatus} />
                <p>{formatNumber(totalVotes([area]))} valid votes</p>
              </div>
            ))}
          </div>
          <section className="panel comparison-panel" aria-labelledby="comparison-table-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Party-by-party view</p>
                <h2 id="comparison-table-title">Compare reported results</h2>
              </div>
              <span className="panel-note">Share of valid votes</span>
            </div>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">Vote count and share by party for {areaA.name} and {areaB.name}</caption>
                <thead>
                  <tr>
                    <th scope="col">Political affiliation</th>
                    <th scope="col" className="numeric">{areaA.name}<span className="th-subtitle">Valid votes · share</span></th>
                    <th scope="col" className="numeric">{areaB.name}<span className="th-subtitle">Valid votes · share</span></th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(({ partyName, first, second }) => (
                    <tr key={partyName}>
                      <th scope="row">{partyName}</th>
                      <td className="numeric">{formatNumber(first?.votes ?? 0)} <span className="comparison-share">{formatPercent(first?.share ?? 0)}</span></td>
                      <td className="numeric">{formatNumber(second?.votes ?? 0)} <span className="comparison-share">{formatPercent(second?.share ?? 0)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="comparison-link-note">This comparison is shareable: the selected area IDs are stored in this page’s URL.</p>
        </>
      ) : (
        <div className="empty-state panel" role="status">
          Choose two different areas above to view a side-by-side comparison. The selected pair will be saved in the URL.
        </div>
      )}
    </PageFrame>
  );
}

function MethodologyPage({
  dataset,
  navigate,
}: {
  dataset: ElectionDataset;
  navigate: (path: string) => void;
}) {
  return (
    <PageFrame dataset={dataset} navigate={navigate}>
      <p className="eyebrow">HOW TO READ THIS DASHBOARD</p>
      <section className="page-heading compact-heading">
        <div>
          <h1>Source &amp; methodology</h1>
          <p className="page-intro">Every displayed figure is traceable to a published source. No projections, winner calls, or inferred values.</p>
        </div>
      </section>
      <div className="methodology-grid">
        <section className="panel method-card method-source">
          <p className="eyebrow">01 · OFFICIAL SOURCE</p>
          <h2>{dataset.sourceName}</h2>
          <p>Table 8: “Number of valid votes by political affiliation,” covering all Canadian provinces and territories in the 44th General Election.</p>
          <dl className="source-details">
            <div><dt>Election date</dt><dd>{formatDate(dataset.date)}</dd></div>
            <div><dt>Source updated</dt><dd>{formatDate(dataset.updatedAt)}</dd></div>
            <div><dt>Reporting status</dt><dd>{dataset.status}</dd></div>
            <div><dt>Dataset scope</dt><dd>One election · 13 province and territory totals</dd></div>
          </dl>
          <a className="button button-outline" href={dataset.sourceUrl} target="_blank" rel="noreferrer">
            Visit Elections Canada source <span aria-hidden="true">↗</span>
          </a>
        </section>
        <section className="panel method-card">
          <p className="eyebrow">02 · CALCULATION RULES</p>
          <h2>Simple, consistent formulas.</h2>
          <ul className="formula-list">
            <li><strong>Valid votes</strong><span>Sum of party votes in the selected area(s).</span></li>
            <li><strong>Party share</strong><span>Party votes ÷ total valid votes × 100.</span></li>
            <li><strong>Display precision</strong><span>Percentages are shown to one decimal; calculations retain full precision.</span></li>
            <li><strong>Sort order</strong><span>Votes descending; equal counts are alphabetized by the official party label.</span></li>
          </ul>
        </section>
        <section className="panel method-card">
          <p className="eyebrow">03 · FIELD NOTES</p>
          <h2>What this table does—and doesn’t—include.</h2>
          <ul className="notes-list">
            <li>Official political-affiliation labels and zero values are preserved.</li>
            <li>Candidate-level results are not included in this summary table.</li>
            <li>Eligible-voter counts are not provided here; turnout is not estimated.</li>
            <li>All areas are marked final because this source is the official post-election results table.</li>
            <li>This is an informational learning project, not an official reporting system or a prediction.</li>
          </ul>
        </section>
        <section className="panel method-card">
          <p className="eyebrow">04 · DATA QUALITY</p>
          <h2>Missing values stay missing.</h2>
          <p>The bundled results are loaded as local JSON and validated before any totals are calculated. Invalid fields and vote values prevent results from rendering. Zero is displayed as 0; optional data that is absent is shown as “Not provided.”</p>
          <p>Published results are complete in this table. If a future dataset indicates partial reporting, its status remains visible rather than being presented as final.</p>
        </section>
      </div>
    </PageFrame>
  );
}

function App() {
  const { location, navigate } = useAppLocation();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/election-results.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`The results file could not be loaded (HTTP ${response.status}).`);
        return response.json() as Promise<unknown>;
      })
      .then((data) => validateElectionDataset(data))
      .then((dataset) => setLoadState({ status: "ready", dataset }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        setLoadState({ status: "error", message });
      });
    return () => controller.abort();
  }, []);

  const dataset = loadState.status === "ready" ? loadState.dataset : undefined;
  const currentPath = location.split("?")[0];
  let detailId = "";
  if (currentPath.startsWith("/area/")) {
    try {
      detailId = decodeURIComponent(currentPath.slice("/area/".length));
    } catch (error) {
      if (!(error instanceof URIError)) throw error;
    }
  }
  const detailArea = dataset?.areas.find((area) => area.id === detailId);

  let content: ReactNode;
  if (loadState.status === "loading") {
    content = (
      <div className="state-screen" role="status">
        <span className="loader" aria-hidden="true" />
        <h1>Loading official results…</h1>
        <p>Validating the bundled election dataset.</p>
      </div>
    );
  } else if (loadState.status === "error") {
    content = (
      <div className="state-screen error-screen" role="alert">
        <span className="state-icon" aria-hidden="true">!</span>
        <p className="eyebrow">RESULTS UNAVAILABLE</p>
        <h1>We couldn’t load the election data.</h1>
        <p>{loadState.message}</p>
        <p>No calculated results are shown until the data can be validated.</p>
      </div>
    );
  } else if (loadState.dataset.areas.length === 0) {
    content = (
      <div className="state-screen" role="status">
        <p className="eyebrow">NO RESULTS AVAILABLE</p>
        <h1>No election data is available.</h1>
        <p>The data file loaded, but it contains no reported areas.</p>
      </div>
    );
  } else if (currentPath === "/") {
    content = <OverviewPage dataset={loadState.dataset} navigate={navigate} />;
  } else if (currentPath === "/compare") {
    content = <ComparePage dataset={loadState.dataset} navigate={navigate} location={location} />;
  } else if (currentPath === "/methodology") {
    content = <MethodologyPage dataset={loadState.dataset} navigate={navigate} />;
  } else if (currentPath.startsWith("/area/") && detailArea) {
    content = <AreaPage area={detailArea} dataset={loadState.dataset} navigate={navigate} />;
  } else {
    content = (
      <div className="state-screen">
        <p className="eyebrow">PAGE NOT FOUND</p>
        <h1>That area isn’t in this dataset.</h1>
        <p>Check the link or return to the overview to explore reported areas.</p>
        <button type="button" className="button button-dark" onClick={() => navigate("/")}>Back to overview</button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header dataset={dataset} location={location} navigate={navigate} />
      {content}
    </div>
  );
}

export default App;
