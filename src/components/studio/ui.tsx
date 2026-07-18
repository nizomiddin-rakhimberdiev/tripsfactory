"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { IconCheck, IconX } from "./icons";

type Toast = { id: number; message: string; kind: "ok" | "error" };
const ToastCtx = createContext<(message: string, kind?: "ok" | "error") => void>(
  () => {},
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((message: string, kind: "ok" | "error" = "ok") => {
    const id = Math.floor(performance.now() * 1000) + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastCtx.Provider value={notify}>
      {children}
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`s-toast ${t.kind === "error" ? "s-toast--error" : ""}`}
        >
          {t.kind === "error" ? <IconX /> : <IconCheck />}
          {t.message}
        </div>
      ))}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

export function Field({
  label,
  required,
  help,
  children,
  right,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="s-field">
      <div className="s-field__label">
        <span>
          {label}
          {required && <span className="s-field__req"> *</span>}
        </span>
        {right}
      </div>
      {children}
      {help && <div className="s-field__help">{help}</div>}
    </div>
  );
}
