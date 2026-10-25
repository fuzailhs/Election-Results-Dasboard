import { formatNumber, formatPercent } from "../format";
import type { PartyTotal } from "../types";

interface PartyResultsProps {
  parties: PartyTotal[];
  title?: string;
}

export function PartyResults({ parties, title = "Party results" }: PartyResultsProps) {
  const maximum = Math.max(...parties.map((party) => party.votes), 0);

  return (
    <section className="panel party-panel" aria-labelledby="party-results-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Results by affiliation</p>
          <h2 id="party-results-title">{title}</h2>
        </div>
        <span className="panel-note">Share of valid votes</span>
      </div>
      {parties.length === 0 ? (
        <p className="empty-state">No party results are available.</p>
      ) : (
        <>
          <div className="party-bars" aria-hidden="true">
            {parties.slice(0, 6).map((party) => (
              <div className="party-bar-row" key={party.partyName}>
                <span className="party-bar-label">{party.partyName}</span>
                <span className="party-bar-track">
                  <span
                    className="party-bar-fill"
                    style={{ width: `${maximum === 0 ? 0 : (party.votes / maximum) * 100}%` }}
                  />
                </span>
                <span className="party-bar-value">{formatPercent(party.share)}</span>
              </div>
            ))}
          </div>
          <div className="table-scroll">
            <table>
              <caption className="sr-only">{title}: vote totals and share for all reported parties</caption>
              <thead>
                <tr>
                  <th scope="col">Political affiliation</th>
                  <th scope="col" className="numeric">Valid votes</th>
                  <th scope="col" className="numeric">Vote share</th>
                </tr>
              </thead>
              <tbody>
                {parties.map((party) => (
                  <tr key={party.partyName}>
                    <th scope="row">{party.partyName}</th>
                    <td className="numeric">{formatNumber(party.votes)}</td>
                    <td className="numeric">{formatPercent(party.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
