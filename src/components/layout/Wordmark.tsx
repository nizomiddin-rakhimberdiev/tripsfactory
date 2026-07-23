import Image from "next/image";
import wordmark from "@/assets/wordmark.png";

/**
 * The TripsFactory lockup — the client's own artwork, not a typeface
 * approximation.
 *
 * Source is the supplied logo with its background removed and cropped to the
 * glyphs (654x581 of the original 1024x1024 was empty). It ships at 400px wide
 * and Next serves an AVIF/WebP derivative at the rendered size, so the browser
 * downloads a few kilobytes rather than the source file.
 *
 * The gradient is baked into the pixels, so this cannot be recoloured by CSS.
 * That is safe here: the header and footer both sit outside the premium
 * dark-theme wrapper, so the lockup is only ever shown on the ivory canvas —
 * where it measures 13:1 contrast at the median.
 */
export function Wordmark({
  className = "",
  size = "md",
  priority = false,
}: {
  className?: string;
  /** md — header and footer. lg — standalone placements. */
  size?: "md" | "lg";
  /** Set on the header instance: it is above the fold and drives LCP. */
  priority?: boolean;
}) {
  return (
    <Image
      src={wordmark}
      alt="TripsFactory"
      priority={priority}
      sizes={size === "lg" ? "82px" : "53px"}
      className={`w-auto ${size === "lg" ? "h-[4.5rem]" : "h-[2.9rem]"} ${className}`}
    />
  );
}
