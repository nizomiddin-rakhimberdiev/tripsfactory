"use client";

import { useEffect } from "react";

/**
 * The Studio talks to the database on every route and had no error boundary,
 * so a dropped connection or a bad query left the editor on Next's raw error
 * screen with no way back.
 *
 * Retry first — most failures here are transient. The digest is shown because
 * it is the only handle on the server-side stack in production, and an editor
 * reporting a problem can quote it.
 */
export default function StudioError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Studio error", error.digest, error);
  }, [error]);

  return (
    <div className="s-card" style={{ padding: 40, textAlign: "center" }}>
      <p style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
        Sahifa yuklanmadi
      </p>
      <p
        style={{
          color: "var(--s-fg-secondary)",
          margin: "8px 0 0",
          fontSize: 13.5,
        }}
      >
        Ma&apos;lumotlarni olishda xatolik yuz berdi. Qaytadan urinib ko&apos;ring
        — muammo takrorlansa, quyidagi kodni yuboring.
      </p>
      <button
        type="button"
        className="s-btn s-btn--primary"
        style={{ marginTop: 20 }}
        onClick={() => unstable_retry()}
      >
        Qaytadan urinish
      </button>
      {error.digest && (
        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "var(--s-fg-muted)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {error.digest}
        </p>
      )}
    </div>
  );
}
