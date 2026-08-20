import { CHAT } from "@/lib/business";

/**
 * WhatsApp and Telegram, in the two places a guest looks for them.
 *
 * A tour is a several-thousand-dollar decision taken from another continent,
 * and a form is a one-way door: you send it and wait, with no idea whether
 * anyone read it. A chat thread answers the question the form cannot — is
 * there a person at the other end — which is why these sit both in the header,
 * where somebody still deciding can find them, and directly under the booking
 * form, where somebody who has decided but has one more question would
 * otherwise close the tab.
 *
 * The marks are drawn rather than imported: two inline paths cost nothing,
 * where an icon package would ship a whole library to render them, and these
 * two shapes are recognised by their silhouette in any colour.
 */

const MARKS: Record<string, React.ReactNode> = {
  WhatsApp: (
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.26-8.24Zm-3.2 4.02c-.15 0-.4.06-.6.28-.21.22-.8.78-.8 1.9s.82 2.2.93 2.36c.12.15 1.6 2.44 3.88 3.42.54.24.96.38 1.29.48.54.17 1.04.15 1.43.09.44-.07 1.34-.55 1.53-1.08.19-.53.19-.99.13-1.08-.05-.09-.2-.15-.43-.26-.22-.11-1.34-.66-1.55-.74-.2-.07-.36-.11-.51.12-.15.22-.58.73-.71.88-.13.15-.26.17-.49.06-.22-.11-.95-.35-1.81-1.12-.67-.6-1.12-1.33-1.25-1.56-.13-.22-.02-.34.1-.46.1-.1.22-.26.34-.4.11-.13.15-.22.22-.37.08-.15.04-.28-.02-.4-.05-.11-.51-1.23-.7-1.68-.18-.44-.37-.38-.5-.39h-.48Z" />
  ),
  Telegram: (
    <path d="M21.94 4.3 18.9 19.1c-.23 1.03-.85 1.28-1.72.8l-4.75-3.5-2.29 2.2c-.25.26-.47.48-.96.48l.34-4.85 8.83-7.98c.38-.34-.09-.53-.6-.19l-10.9 6.87-4.7-1.47c-1.02-.32-1.04-1.02.21-1.51L20.63 3.1c.85-.31 1.6.2 1.31 1.2Z" />
  ),
};

export function ChatLinks({
  variant = "compact",
  label,
  className = "",
}: {
  /** The line above the buttons, already translated by the calling page.
      Passed in rather than read here so this stays a server component with no
      client bundle — it renders inside the client-side nav as well. */
  label?: string;
  /**
   * `compact` is the header: marks only, sized to sit beside the language
   * switcher without widening a phone's top bar.
   * `full` is under a form: marks with names, because there it is an offer
   * being made rather than a control being found.
   */
  variant?: "compact" | "full";
  className?: string;
}) {
  if (variant === "full") {
    return (
      <div className={className}>
        {label && <p className="mb-4 text-sm text-muted">{label}</p>}
        <div className="flex flex-wrap items-center gap-3">
          {CHAT.map((c) => (
            <a
              key={c.label}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-border px-4 py-3 text-sm transition-colors duration-300 hover:border-primary hover:text-primary"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                // The mark keeps its own colour so it stays recognisable; the
                // label and border answer to the page.
                style={{ fill: c.brand }}
              >
                {MARKS[c.label]}
              </svg>
              {c.label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {CHAT.map((c) => (
        <a
          key={c.label}
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={c.label}
          title={c.label}
          className="rounded-lg p-2 text-muted transition-colors duration-300 hover:text-[--mark]"
          style={{ ["--mark" as string]: c.brand }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {MARKS[c.label]}
          </svg>
        </a>
      ))}
    </div>
  );
}
