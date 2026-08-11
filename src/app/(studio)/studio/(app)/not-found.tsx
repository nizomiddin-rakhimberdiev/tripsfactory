import Link from "next/link";

/**
 * A Studio URL that points at nothing — a deleted record, a mistyped id, a
 * bookmark that outlived its tour.
 *
 * Without this the nearest boundary was `global-not-found`, which brings its
 * own `<html>` document. Rendering that inside the Studio layout is not
 * something React can do, so Next abandoned the server render and finished on
 * the client: the editor got a bare English "404: This page could not be
 * found." with no sidebar, no way back — and, because the response had already
 * started streaming, an HTTP 200 on a page that is plainly not there.
 *
 * Handling it here keeps the answer inside the panel and in the panel's own
 * language.
 */
export default function StudioNotFound() {
  return (
    <div className="s-card" style={{ padding: 40, textAlign: "center" }}>
      <p style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
        Bunday yozuv topilmadi
      </p>
      <p
        style={{
          color: "var(--s-fg-secondary)",
          margin: "8px 0 0",
          fontSize: 13.5,
        }}
      >
        Ehtimol u o&apos;chirilgan yoki havola noto&apos;g&apos;ri.
      </p>
      <Link
        href="/studio"
        className="s-btn s-btn--primary"
        style={{ marginTop: 20 }}
      >
        Boshqaruv paneliga qaytish
      </Link>
    </div>
  );
}
