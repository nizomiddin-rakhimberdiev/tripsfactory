"use client";

import { useState } from "react";
import Image from "next/image";

export function Carousel({
  images,
  alt,
  aspect = "aspect-[5/2]",
}: {
  images: string[];
  alt: string;
  aspect?: string;
}) {
  const [i, setI] = useState(0);
  if (images.length === 0) return null;

  const go = (d: number) =>
    setI((prev) => (prev + d + images.length) % images.length);

  return (
    <div className={`relative ${aspect} overflow-hidden rounded-2xl bg-surface`}>
      {images.map((src, idx) => (
        <Image
          key={src + idx}
          src={src}
          alt={alt}
          fill
          priority={idx === 0}
          sizes="(max-width: 896px) 100vw, 896px"
          className={`object-cover transition-opacity duration-500 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Oldingi"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Keyingi"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`${idx + 1}-rasm`}
                onClick={() => setI(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === i ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
