const KINDS = [
  'Model UN conferences',
  'University society events',
  'Sports galas',
  'Concerts and music nights',
  'Corporate summits',
  'Expos and trade shows',
  'Convocations',
  'Workshops and bootcamps',
];

/** Kinds of events EPMS runs, drifting past as a band under the hero. */
export function Ticker() {
  const items = [...KINDS, ...KINDS];
  return (
    <div className="ticker" aria-label="Built for MUNs, society events, sports galas, concerts, summits, expos, convocations and workshops">
      <div className="ticker__track" aria-hidden="true">
        {items.map((k, i) => (
          <span className="ticker__item" key={i}>
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
