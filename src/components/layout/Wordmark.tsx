/**
 * The TripsFactory lockup, set in type rather than shipped as an image so it
 * stays crisp at any density and inherits colour.
 *
 * Mirrors the logo: monumental condensed "TRIPS" over a lighter, widely
 * tracked "FACTORY" of matching width, both in the logo's maroon. The
 * negative right margin on the lower line cancels the trailing space that
 * letter-spacing adds after the final letter, so the two lines stay optically
 * flush on the left and the block centres correctly.
 */
export function Wordmark({
  className = "",
  size = "md",
}: {
  className?: string;
  /** md — header/footer. lg — standalone placements. */
  size?: "md" | "lg";
}) {
  const top = size === "lg" ? "text-[2rem]" : "text-[1.55rem]";
  const bottom = size === "lg" ? "text-[0.82rem]" : "text-[0.66rem]";

  return (
    <span
      className={`inline-block font-[family-name:var(--font-wordmark)] uppercase text-primary ${className}`}
    >
      <span className={`block font-bold leading-[0.82] ${top}`}>Trips</span>
      <span
        className={`-mr-[0.34em] block font-medium leading-none tracking-[0.34em] ${bottom}`}
      >
        Factory
      </span>
    </span>
  );
}
