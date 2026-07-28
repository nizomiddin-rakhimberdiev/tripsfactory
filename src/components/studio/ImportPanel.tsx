"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, useToast } from "./ui";
import { IconCheck, IconDownload, IconX } from "./icons";

type Plan = {
  row: number;
  slug: string;
  title: string;
  action: "create" | "update" | "skip";
  errors: string[];
  warnings: string[];
  stats: { days: number; included: number; excluded: number; departures: number; cities: number; images: number };
};

type Issue = { row: number | null; message: string; level: "error" | "warning" };
type Outcome = { slug: string; ok: boolean; action: "created" | "updated" | "failed"; message?: string };
type Report = { issues: Issue[]; plans: Plan[]; outcomes?: Outcome[] };
type Answer = { report?: Report; error?: string; total?: number; nextOffset?: number | null; done?: number };

const TEMPLATE = "/tripsfactory-turlar-shabloni.xlsx";

export function ImportPanel() {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [done, setDone] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  /** One request. Anything that is not JSON is reported as what it actually was. */
  async function call(body: Record<string, unknown>): Promise<Answer> {
    const res = await fetch("/api/studio/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url, ...body }),
    });
    const text = await res.text();
    try {
      const json = JSON.parse(text) as Answer;
      if (!res.ok && !json.error) json.error = `Server ${res.status} javob qaytardi.`;
      return json;
    } catch {
      return {
        error:
          res.status === 504
            ? "So'rov juda uzoq davom etdi (504). Qaytadan bosing — import to'xtagan joyidan davom etadi."
            : `Server tushunarsiz javob qaytardi (${res.status}).`,
      };
    }
  }

  async function preview() {
    setBusy("preview");
    setError(null);
    setReport(null);
    setDone(false);
    setProgress(null);
    try {
      const json = await call({ mode: "preview" });
      if (json.error || !json.report) return setError(json.error ?? "Import bajarilmadi.");
      setReport(json.report);
    } catch {
      setError("Server bilan bog'lanib bo'lmadi. Internetni tekshirib, qaytadan urining.");
    } finally {
      setBusy(null);
    }
  }

  /**
   * Commits in batches, resuming from the offset the server hands back. A batch
   * that fails stops the loop with everything before it already saved, and the
   * button can simply be pressed again — tours already written are recognised
   * and updated rather than duplicated.
   */
  async function commit() {
    setBusy("commit");
    setError(null);
    const plans: Plan[] = [];
    const outcomes: Outcome[] = [];
    const issues: Issue[] = [];
    let offset: number | null = 0;

    try {
      while (offset !== null) {
        const json: Answer = await call({ mode: "commit", offset });
        if (json.error || !json.report) {
          setError(json.error ?? "Import bajarilmadi.");
          break;
        }
        plans.push(...json.report.plans);
        outcomes.push(...(json.report.outcomes ?? []));
        issues.push(...json.report.issues);
        setReport({ plans, outcomes, issues });
        setProgress({ done: json.done ?? plans.length, total: json.total ?? plans.length });
        offset = json.nextOffset ?? null;
      }
    } catch {
      setError("Server bilan bog'lanib bo'lmadi. Qaytadan bosing — qolgani davom etadi.");
    } finally {
      setBusy(null);
      const ok = outcomes.filter((o) => o.ok).length;
      if (ok) {
        setDone(true);
        toast(`${ok} ta tur qoralama sifatida qo'shildi.`, "ok");
      } else if (outcomes.length) {
        toast("Hech qanday tur yozilmadi.", "error");
      }
    }
  }

  const run = (mode: "preview" | "commit") => (mode === "preview" ? preview() : commit());

  const ready = report?.plans.filter((p) => p.action !== "skip") ?? [];
  const blocked = report?.plans.filter((p) => p.action === "skip") ?? [];
  const fatal = report?.issues.filter((i) => i.level === "error") ?? [];

  /**
   * The same four notes repeated down sixty cards read as "everything is
   * broken" when they mean "this is expected". Anything affecting more than two
   * tours is counted once at the top and dropped from the cards, so what stays
   * beside a tour is genuinely specific to it.
   */
  const grouped = new Map<string, { count: number; sample: string }>();
  for (const p of report?.plans ?? []) {
    for (const w of p.warnings) {
      const k = w.replace(/\d+/g, "#").slice(0, 60);
      const entry = grouped.get(k);
      if (entry) entry.count += 1;
      else grouped.set(k, { count: 1, sample: w });
    }
  }
  const common = new Set([...grouped].filter(([, v]) => v.count > 2).map(([k]) => k));
  const summary = [...grouped.entries()]
    .filter(([k]) => common.has(k))
    .sort((a, b) => b[1].count - a[1].count);
  const ownWarnings = (p: Plan) =>
    p.warnings.filter((w) => !common.has(w.replace(/\d+/g, "#").slice(0, 60)));

  // Sixty rows of green cards teach nothing; problems first, the rest on demand.
  const visible = showAll || done ? (report?.plans ?? []) : [...blocked, ...ready].slice(0, 12);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="s-card">
        <div className="s-card__body">
          <h2 className="s-imp__h">1. Shablon</h2>
          <ol className="s-imp__steps">
            <li>
              Shablonni yuklab oling → Google Drive&apos;ga yuklang → o&apos;ng tugma →{" "}
              <b>Open with</b> → <b>Google Sheets</b>.
            </li>
            <li>
              <b>Share</b> → <b>Anyone with the link</b> → mijozga havolani bering.
              Mijoz har bir turni bitta qatorga yozadi.
            </li>
            <li>To&apos;ldirilgach, o&apos;sha havolani quyiga tashlang.</li>
          </ol>
          <div style={{ marginTop: 14 }}>
            <a className="s-btn s-btn--primary" href={TEMPLATE} download>
              <IconDownload />
              Shablonni yuklab olish (.xlsx)
            </a>
          </div>
        </div>
      </section>

      <section className="s-card">
        <div className="s-card__body">
          <h2 className="s-imp__h">2. Jadval havolasi</h2>
          <Field
            label="Google Sheets havolasi"
            help="Jadval «Anyone with the link» qilib ulashilgan bo'lishi kerak. Varaq nomi «Turlar» bo'lib qolsin."
          >
            <input
              className="s-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              spellCheck={false}
            />
          </Field>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              className={`s-btn ${ready.length && !done ? "" : "s-btn--primary"}`}
              disabled={!url.trim() || busy !== null}
              onClick={() => run("preview")}
            >
              {busy === "preview" ? "Tekshirilmoqda…" : "Tekshirish"}
            </button>
            {report && !done && ready.length > 0 && (
              <button
                className="s-btn s-btn--primary"
                disabled={busy !== null}
                onClick={() => {
                  if (confirm(`${ready.length} ta tur qoralama sifatida qo'shiladi. Davom etamizmi?`)) run("commit");
                }}
              >
                {busy === "commit"
                  ? `Qo'shilmoqda… ${progress ? `${progress.done}/${progress.total}` : ""}`
                  : `${ready.length} ta turni qo'shish`}
              </button>
            )}
          </div>
          {error && <div className="s-imp__fatal">{error}</div>}
        </div>
      </section>

      {report && (
        <section className="s-card">
          <div className="s-card__body">
            <h2 className="s-imp__h">{done ? "3. Natija" : "3. Tekshiruv"}</h2>

            <p className="s-imp__lead">
              {done ? (
                <>
                  Turlar <b>qoralama</b> holatida qo&apos;shildi — saytda hali ko&apos;rinmaydi.
                  Rasmi yo&apos;qlariga vaqtinchalik rasm qo&apos;yildi. Har birini Studio →
                  Turlar bo&apos;limida ochib, rasmini almashtirasiz va «Saytda ko&apos;rsatilsin»
                  ni belgilaysiz.
                </>
              ) : (
                <>
                  Hech narsa hali yozilmadi.{" "}
                  {ready.length > 0
                    ? `${ready.length} ta tur tayyor${blocked.length ? `, ${blocked.length} tasida xato bor` : ""}.`
                    : "Qo'shiladigan tur yo'q — quyidagi xatolarni to'g'rilang."}
                </>
              )}
            </p>

            {fatal.map((i, n) => (
              <div key={`f${n}`} className="s-imp__fatal">
                {i.message}
              </div>
            ))}

            {summary.length > 0 && (
              <div className="s-imp__notes" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                <div className="s-imp__noteshead">Barcha turlarga tegishli eslatmalar</div>
                {summary.map(([k, v]) => (
                  <div key={k} className="s-imp__msg s-imp__msg--warn">
                    <b style={{ whiteSpace: "nowrap" }}>{v.count} ta turda</b>
                    {v.sample.replace(/^\d+ ta /, "")}
                  </div>
                ))}
              </div>
            )}

            <div className="s-imp__list" style={{ marginTop: 14 }}>
              {visible.map((p) => {
                const outcome = report.outcomes?.find((o) => o.slug === p.slug);
                return (
                  <div key={`${p.slug}-${p.row}`} className="s-imp__row">
                    <div className="s-imp__rowhead">
                      <span className="s-imp__title">{p.title}</span>
                      {outcome ? (
                        <span className={`s-badge ${outcome.ok ? "s-badge--green" : "s-badge--gray"}`}>
                          {outcome.action === "created"
                            ? "Qo'shildi"
                            : outcome.action === "updated"
                              ? "Yangilandi"
                              : "Bajarilmadi"}
                        </span>
                      ) : (
                        <span
                          className={`s-badge ${
                            p.action === "create" ? "s-badge--green" : p.action === "update" ? "s-badge--teal" : "s-badge--gray"
                          }`}
                        >
                          {p.action === "create" ? "Yangi" : p.action === "update" ? "Yangilanadi" : "Xato"}
                        </span>
                      )}
                    </div>

                    <div className="s-imp__stats">
                      {p.stats.days} kun · {p.stats.cities} shahar · {p.stats.included}/{p.stats.excluded} band ·{" "}
                      {p.stats.departures} sana · {p.stats.images} rasm · {p.row}-qator
                    </div>

                    {p.errors.map((e, n) => (
                      <div key={`e${n}`} className="s-imp__msg s-imp__msg--err">
                        <IconX width={13} height={13} />
                        {e}
                      </div>
                    ))}
                    {ownWarnings(p).map((w, n) => (
                      <div key={`w${n}`} className="s-imp__msg s-imp__msg--warn">
                        {w}
                      </div>
                    ))}
                    {outcome?.message && !outcome.ok && (
                      <div className="s-imp__msg s-imp__msg--err">
                        <IconX width={13} height={13} />
                        {outcome.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!done && !showAll && (report.plans.length ?? 0) > visible.length && (
              <button className="s-btn s-btn--sm" style={{ marginTop: 12 }} onClick={() => setShowAll(true)}>
                Qolgan {report.plans.length - visible.length} tasini ko&apos;rsatish
              </button>
            )}

            {done && (
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Link className="s-btn s-btn--primary" href="/studio/tours">
                  <IconCheck />
                  Turlar ro&apos;yxatiga o&apos;tish
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
