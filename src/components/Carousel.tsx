"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

/** Horizontal travel (px) that counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 40;

export function Carousel({
  images,
  alt,
  aspect = "aspect-[5/2]",
  rounded = true,
}: {
  images: string[];
  alt: string;
  aspect?: string;
  /** Set false for full-bleed placements where the image runs edge to edge. */
  rounded?: boolean;
}) {
  const t = useTranslations("common");
  const [i, setI] = useState(0);
  // Slides are stacked and cross-faded, so every image sits inside the
  // viewport — `loading="lazy"` would not defer anything. Mounting only the
  // frames the visitor has actually reached is what keeps a ten-image gallery
  // from pulling ten full-width images on first paint.
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0]));
  const touchStartX = useRef<number | null>(null);

  if (images.length === 0) return null;

  const show = (next: number) => {
    const target = (next + images.length) % images.length;
    setI(target);
    setSeen((prev) =>
      prev.has(target) ? prev : new Set(prev).add(target),
    );
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null || images.length < 2) return;
    const delta = e.changedTouches[0].clientX - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    show(i + (delta < 0 ? 1 : -1));
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`relative ${aspect} overflow-hidden bg-surface ${rounded ? "rounded-2xl" : ""}`}
    >
      {images.map((src, idx) =>
        seen.has(idx) ? (
          <Image
            key={src + idx}
            src={src}
            alt={alt}
            fill
            priority={idx === 0}
            sizes={rounded ? "(max-width: 896px) 100vw, 896px" : "100vw"}
            className={`object-cover transition-opacity duration-700 ${
              idx === i ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : null,
      )}

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label={t("prevImage")}
            onClick={() => show(i - 1)}
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="m15 6-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label={t("nextImage")}
            onClick={() => show(i + 1)}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="m9 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={t("goToImage", { number: idx + 1 })}
                aria-current={idx === i}
                onClick={() => show(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === i ? "w-7 bg-white" : "w-2 bg-white/55 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
