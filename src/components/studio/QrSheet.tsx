"use client";

import { useEffect, useState } from "react";
import { makeQr, type Qr } from "@/lib/studio/qr";

export type SheetCode = { code: string; name: string; assigned: boolean };

/**
 * Every QR code on one page, ready for the print shop.
 *
 * Two things leave here. The page itself prints to PDF from the browser — a
 * proof sheet somebody can check against the banners when they arrive. And a
 * single SVG holding every code, because a print shop putting a QR on a two
 * metre banner needs vector, and forty separate downloads is not a workflow.
 *
 * Both are generated in the browser from the codes themselves: nothing is
 * stored, so a sheet can never show a code that no longer means what it says.
 */
export function QrSheet({
  codes,
  origin,
}: {
  codes: SheetCode[];
  origin: string;
}) {
  const [qrs, setQrs] = useState<Record<string, Qr>>({});

  useEffect(() => {
    let alive = true;
    void (async () => {
      const out: Record<string, Qr> = {};
      for (const c of codes) {
        out[c.code] = await makeQr(`${origin}/r/${c.code}`);
      }
      if (alive) setQrs(out);
    })();
    return () => {
      alive = false;
    };
  }, [codes, origin]);

  const ready = Object.keys(qrs).length === codes.length && codes.length > 0;

  /**
   * One SVG containing them all, laid out on a grid with each code labelled.
   * A designer opens it once and pulls out the square they need.
   */
  function downloadSheet() {
    if (!ready) return;
    const CELL = 340;
    const LABEL = 46;
    const COLS = 4;
    const rows = Math.ceil(codes.length / COLS);
    const width = COLS * CELL;
    const height = rows * (CELL + LABEL);

    const cells = codes
      .map((c, i) => {
        const x = (i % COLS) * CELL;
        const y = Math.floor(i / COLS) * (CELL + LABEL);
        const qr = qrs[c.code];
        // The module count comes from the code itself. Assuming it is how the
        // first version of this shipped a sheet whose codes would have been
        // drawn at the wrong scale — and clipped outright for any code longer
        // than the one it was guessed from.
        return `<g transform="translate(${x + 20} ${y + 20})">
  <svg width="${CELL - 40}" height="${CELL - 40}" viewBox="0 0 ${qr.size} ${qr.size}" shape-rendering="crispEdges">${qr.inner}</svg>
  <text x="${(CELL - 40) / 2}" y="${CELL - 40 + 30}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="#6e1218">${c.code.toUpperCase()}</text>
</g>`;
      })
      .join("\n");

    const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="#ffffff"/>
${cells}
</svg>`;

    const blob = new Blob([doc], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tripsfactory-qr-${codes.length}ta.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="s-print-actions">
        <button
          type="button"
          className="s-btn s-btn--primary"
          onClick={() => window.print()}
          disabled={!ready}
        >
          Chop etish / PDF
        </button>
        <button
          type="button"
          className="s-btn"
          onClick={downloadSheet}
          disabled={!ready}
        >
          Hammasini bitta SVG qilib yuklab olish
        </button>
        {!ready && (
          <span style={{ color: "var(--s-fg-muted)", fontSize: 13 }}>
            QR kodlar tayyorlanmoqda…
          </span>
        )}
      </div>

      <div className="s-qrsheet">
        {codes.map((c) => (
          <figure key={c.code} className="s-qrsheet__cell">
            <div
              className="s-qrsheet__code"
              dangerouslySetInnerHTML={{ __html: qrs[c.code]?.svg ?? "" }}
            />
            <figcaption>
              <strong>{c.code.toUpperCase()}</strong>
              <span>
                {origin.replace(/^https?:\/\//, "")}/r/{c.code}
              </span>
              <span className="s-qrsheet__who">
                {c.assigned ? c.name : "— biriktirilmagan —"}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
