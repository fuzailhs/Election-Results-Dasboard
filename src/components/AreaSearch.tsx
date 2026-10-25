import { useMemo, useState } from "react";
import type { ElectionArea } from "../types";

interface AreaSearchProps {
  areas: ElectionArea[];
  onSelect: (area: ElectionArea) => void;
}

export function AreaSearch({ areas, onSelect }: AreaSearchProps) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [];
    return areas.filter((area) => area.name.toLocaleLowerCase().includes(normalized));
  }, [areas, query]);

  return (
    <section className="panel search-panel" aria-labelledby="area-search-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Explore the results</p>
          <h2 id="area-search-title">Find a province or territory</h2>
        </div>
        <span className="icon-chip" aria-hidden="true">⌕</span>
      </div>
      <label className="field-label" htmlFor="area-search">Search by official area label</label>
      <input
        id="area-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try “Ont.” or “Que.”"
        autoComplete="off"
        aria-describedby="area-search-help"
      />
      <p className="field-help" id="area-search-help">Search is case-insensitive. Select an area to open its details.</p>
      {query.trim() && (
        matches.length > 0 ? (
          <ul className="search-results" aria-label="Matching areas">
            {matches.map((area) => (
              <li key={area.id}>
                <button type="button" className="search-result" onClick={() => onSelect(area)}>
                  <span>{area.name}</span>
                  <span className="result-arrow" aria-hidden="true">View results <span>→</span></span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="inline-empty" role="status">No areas match “{query.trim()}”. Try another search.</p>
        )
      )}
      <div className="area-chips" aria-label="Browse all areas">
        {areas.map((area) => (
          <button type="button" className="area-chip" key={area.id} onClick={() => onSelect(area)}>
            {area.name}
          </button>
        ))}
      </div>
    </section>
  );
}
