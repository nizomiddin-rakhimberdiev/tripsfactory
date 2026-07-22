"use client";

import { useId, useState } from "react";

type Day = { day: number; title: string; description: string };

export function ItineraryAccordion({ days }: { days: Day[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {days.map((d, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={d.day} className={i > 0 ? "border-t border-border" : ""}>
            <button
              type="button"
              id={buttonId}
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-300 hover:bg-surface-muted"
            >
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {d.day}
              </span>
              <span className="flex-1 font-semibold">{d.title}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className={`flex-shrink-0 text-muted transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
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
            {/*
              0fr -> 1fr gives a real height transition without measuring.
              aria-hidden matters as much as the animation: the panel stays in
              the DOM while collapsed, so without it a screen reader would read
              every day's description regardless of what is open. Safe here
              because the panel holds no focusable elements.
            */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!isOpen}
              className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 pl-[4.5rem] text-sm leading-relaxed text-muted">
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
