/**
 * Placeholders for the Studio's loading states.
 *
 * Every Studio route is server-rendered on demand against the database, so each
 * navigation has a real wait — and until now it showed nothing at all. These
 * hold the shape of what is coming at the same dimensions, so nothing jumps
 * when the data lands.
 *
 * Marked aria-hidden with a single live region above them: a screen reader
 * should hear "loading" once, not read out two dozen empty boxes.
 */
export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="s-table-wrap" aria-hidden="true">
      <table className="s-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <div className="s-skel s-skel--line" style={{ width: "60%" }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  {c === 0 ? (
                    <div className="s-skel s-skel--thumb" />
                  ) : (
                    <div
                      className="s-skel s-skel--line"
                      style={{ width: `${["70%", "45%", "55%", "40%"][c % 4]}` }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonPageHead() {
  return (
    <div className="s-pagehead" aria-hidden="true">
      <div className="s-pagehead__text">
        <div className="s-skel s-skel--title" />
        <div
          className="s-skel s-skel--line"
          style={{ width: 280, marginTop: 10 }}
        />
      </div>
    </div>
  );
}

export function SkeletonStats({ n = 6 }: { n?: number }) {
  return (
    <div className="s-stats" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="s-skel s-skel--stat" />
      ))}
    </div>
  );
}

/** The one thing assistive tech should hear while a route loads. */
export function LoadingAnnounce({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="s-visually-hidden">
      {label}
    </span>
  );
}
