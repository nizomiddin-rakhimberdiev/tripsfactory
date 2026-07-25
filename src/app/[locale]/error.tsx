"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * Error boundary for the site. There was none, so any runtime failure fell
 * through to Next's unstyled default and the visitor was left with no way to
 * recover.
 *
 * Note the prop is `unstable_retry`, not `reset` — that is this version's
 * signature, and the older name silently does nothing.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    // The digest is the only handle on the server-side stack in production.
    console.error("Page error", error.digest, error);
  }, [error]);

  return (
    <div className="tf-section mx-auto max-w-2xl px-4 text-center md:px-6">
      <h1 className="tf-display tf-display-2">{t("title")}</h1>
      <p className="tf-lead mx-auto mt-5 max-w-md">{t("body")}</p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="tf-btn tf-btn-primary mt-9"
      >
        {t("retry")}
      </button>
    </div>
  );
}
