"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/**
 * Brand select.
 *
 * A native <select> was here first, and it could not be made to look like this
 * site: the browser hands the open list to the operating system, which paints
 * it in its own chrome — on macOS a grey panel with a blue highlight. No amount
 * of CSS reaches it. Rebuilt as a listbox so the open state belongs to the
 * brand.
 *
 * Everything the native control gave away for free is put back by hand:
 * type-ahead, Home/End, arrow-key roving focus, Escape, click-away, and the
 * aria wiring that lets a screen reader announce it as a listbox. Focus returns
 * to the trigger on close, so keyboard order never jumps.
 */
export function SelectMenu({
  value,
  onChange,
  options,
  label,
  icon,
  className = "",
  compact = false,
  align = "left",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Micro-label above the value, e.g. "Destination". Hidden when compact. */
  label: string;
  icon?: React.ReactNode;
  className?: string;
  /** Bare value and caret, no field chrome — for the header. */
  compact?: boolean;
  /** Which edge the list hangs from. Right, near a viewport edge. */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ query: "", at: 0 });
  const id = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  const openAt = useCallback(
    (index: number) => {
      setActiveIndex(Math.min(Math.max(index, 0), options.length - 1));
      setOpen(true);
    },
    [options.length],
  );

  // Pointer outside the control dismisses it, exactly as the native list does.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted row in view when arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLLIElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function commit(index: number) {
    onChange(options[index].value);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = options.length - 1;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openAt(selectedIndex);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        // Let focus leave, but do not strand an open list behind it.
        setOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i >= last ? 0 : i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? last : i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
      default: {
        // Type-ahead: consecutive letters build a query, a pause resets it.
        if (e.key.length !== 1 || e.altKey || e.ctrlKey || e.metaKey) return;
        const now = Date.now();
        const t = typeahead.current;
        t.query = now - t.at > 700 ? e.key : t.query + e.key;
        t.at = now;
        const q = t.query.toLowerCase();
        const hit = options.findIndex((o) =>
          o.label.toLowerCase().startsWith(q),
        );
        if (hit >= 0) setActiveIndex(hit);
      }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${id}-label`}
        onClick={() => (open ? close(false) : openAt(selectedIndex))}
        onKeyDown={onKeyDown}
        className={
          compact
            ? "flex items-center gap-1.5 rounded-lg py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            : "flex w-full items-center gap-3 rounded-full px-5 py-2.5 text-left transition-colors hover:bg-white/45"
        }
      >
        {icon}
        {compact ? (
          <>
            <span id={`${id}-label`} className="sr-only">
              {label}
            </span>
            <span className="truncate">{selected?.label}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1">
            <span
              id={`${id}-label`}
              className="tf-eyebrow block text-[10px] leading-none text-muted"
            >
              {label}
            </span>
            <span className="mt-1 block truncate text-sm text-foreground">
              {selected?.label}
            </span>
          </span>
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
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

      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          className={`absolute top-[calc(100%+0.5rem)] z-50 max-h-64 overflow-auto rounded-2xl border border-border bg-surface p-1.5 shadow-[0_16px_40px_rgb(74_52_38/0.18)] ${
            compact
              ? `min-w-[9rem] ${align === "right" ? "right-0" : "left-0"}`
              : "left-0 right-0"
          }`}
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={o.value}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActiveIndex(i)}
                onClick={() => commit(i)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-surface-muted text-foreground" : "text-muted"
                } ${isSelected ? "font-medium text-primary" : ""}`}
              >
                {/* A fixed-width slot, so labels stay aligned whether or not
                    the row carries a tick. */}
                <span className="w-3.5 shrink-0 text-primary">
                  {isSelected && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="m5 13 4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="truncate">{o.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
