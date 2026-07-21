/**
 * Shared page header — eyebrow + display title + optional subtitle.
 * Keeps section openers consistent across listing and content pages.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      {eyebrow && (
        <p className="tf-eyebrow mb-3 text-xs text-primary">{eyebrow}</p>
      )}
      <h1 className="tf-display text-4xl sm:text-5xl">{title}</h1>
      {subtitle && (
        <p
          className={`mt-4 max-w-2xl text-lg text-muted ${center ? "mx-auto" : ""}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
