/**
 * QR codes for the Studio, in one place.
 *
 * There were two copies of this — one in the partner editor, one in the print
 * sheet — and both were wrong in different ways. The editor dropped the
 * encoder's SVG into a 200px box while the markup carried `width="320"`, so
 * the code overflowed its card and covered the page behind it. The sheet built
 * a combined file assuming every code was 41 modules across; they are 35 for a
 * code like `/r/tf-001`, and more for a longer one — which would have shipped
 * a print file with clipped, unscannable codes.
 *
 * Both came from guessing at the encoder's output instead of reading it. So
 * this reads it: the module count is taken from the viewBox the encoder
 * actually produced, and the fixed pixel size is stripped so CSS decides how
 * big the code is drawn.
 */
const OPTIONS = {
  type: "svg" as const,
  margin: 1,
  // Printed large, taped to a desk, photographed under lobby lighting,
  // sometimes with a scuffed corner. The densest correction level is worth it.
  errorCorrectionLevel: "H" as const,
  color: { dark: "#6e1218", light: "#ffffff" },
};

export type Qr = {
  /** The drawing, without an <svg> wrapper. */
  inner: string;
  /** Module count including the quiet zone — the viewBox extent. */
  size: number;
  /** A complete, responsive <svg>: sized by CSS, never by an attribute. */
  svg: string;
};

export async function makeQr(url: string): Promise<Qr> {
  const QR = await import("qrcode");
  const raw = await QR.toString(url, OPTIONS);

  const size = Number(
    /viewBox="0 0 (\d+(?:\.\d+)?) /.exec(raw)?.[1] ?? "0",
  );
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");

  if (!size || !inner) {
    // Better an empty frame than a code that looks scannable and is not.
    return { inner: "", size: 0, svg: "" };
  }

  return {
    inner,
    size,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR">${inner}</svg>`,
  };
}
