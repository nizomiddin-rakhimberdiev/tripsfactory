/**
 * The TripsFactory lockup, set in live type.
 *
 * Mirrors the logo artwork: monumental ultra-condensed "TRIPS" (Teko) over a
 * squared geometric "FACTORY" (Rajdhani) tracked to the same width, both in
 * the logo's maroon. All sizing and tracking lives in .tf-wordmark in
 * globals.css — see the note there before adjusting.
 */
export function Wordmark({
  className = "",
  size = "md",
}: {
  className?: string;
  /** md — header and footer. lg — standalone placements. */
  size?: "md" | "lg";
}) {
  return (
    <span
      className={`tf-wordmark text-primary ${size === "lg" ? "tf-wordmark--lg" : ""} ${className}`}
    >
      <span className="tf-wordmark__top">Trips</span>
      <span className="tf-wordmark__bottom">Factory</span>
    </span>
  );
}
