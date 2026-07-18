"use client";

import { useState } from "react";

type Day = { day: number; title: string; description: string };

export function ItineraryAccordion({ days }: { days: Day[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {days.map((d, i) => {
        const isOpen = open === i;
        return (
          <div key={d.day} className={i > 0 ? "border-t border-border" : ""}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface"
            >
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {d.day}
              </span>
              <span className="flex-1 font-semibold">{d.title}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className={`flex-shrink-0 text-muted transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              >
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              className={`grid transition-all duration-200 ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-4 pl-[3.75rem] text-sm leading-relaxed text-muted">
                  {d.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
