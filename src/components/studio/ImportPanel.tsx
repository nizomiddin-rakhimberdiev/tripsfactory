"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, useToast } from "./ui";
import { IconCheck, IconDownload, IconExternal, IconX } from "./icons";

type Plan = {
  row: number;
  slug: string;
  title: string;
  action: "create" | "update" | "skip";
  errors: string[];
  warnings: string[];
  stats: {
    days: number;
    included: number;
    excluded: number;
    departures: number;
    cities: number;
    images: number;
  };
};

type Issue = {
  tab: string;
  row: number | null;
  message: string;
  level: "error" | "warning";
};

type Outcome = {
  slug: string;
  ok: boolean;
  action: "created" | "updated" | "failed";
  message?: string;
};

type Report = { issues: Issue[]; plans: Plan[]; outcomes?: Outcome[] };

/**
 * Generated per download rather than served from public/: the workbook's
 * country and city dropdowns are built from the CMS as it stands right now, so
 * a manager can only pick places that actually exist.
 */
const TEMPLATE = "/api/studio/import/template";

export function ImportPanel() {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [done, setDone] = useState(false);

  async function run(mode: "preview" | "commit") {
    setBusy(mode);
    setError(null);
    if (mode === "preview") {
      setReport(null);
      setDone(false);
    }
    try {
      const res = await fetch("/api/studio/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url, mode }),
      });
      const json = (await res.json()) as { report?: Report; error?: string };
      if (!res.ok || !json.report) {
        setError(json.error ?? "Import bajarilmadi.");
        return;
      }
      setReport(json.report);
      if (mode === "commit") {
        setDone(true);
        const ok = json.report.outcomes?.filter((o) => o.ok).length ?? 0;
        toast(
          ok ? `${ok} ta tur bazaga yozildi.` : "Hech qanday tur yozilmadi.",
          ok ? "ok" : "error",
        );
      }
    } catch {
      setError("Server bilan bog'lanib bo'lmadi. Qaytadan urinib ko'ring.");
    } finally {
      setBusy(null);
    }
  }

  const ready = report?.plans.filter((p) => p.action !== "skip") ?? [];
  const blocked = report?.plans.filter((p) => p.action === "skip") ?? [];
  const fatal = report?.issues.filter((i) => i.level === "error") ?? [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="s-card">
        <div className="s-card__body">
          <h2 className="s-imp__h">1. Shablonni mijozga bering</h2>
          <ol className="s-imp__steps">
            <li>
              Shablonni yuklab oling va Google Drive&apos;ga yuklang — Drive&apos;da fayl
              ustiga o&apos;ng tugma → <b>Open with</b> → <b>Google Sheets</b>.
            </li>
            <li>
              Hosil bo&apos;lgan jadvalni mijozga ulashing:{" "}
              <b>Share</b> → <b>Anyone with the link</b> → roli <b>Editor</b>.
              Rasmlar uchun alohida Drive papkasini ham shu tarzda ulashing.
            </li>
            <li>
              Mijoz to&apos;ldirgach, jadvaldagi <b>Tekshiruv</b> varag&apos;i
              yashil bo&apos;lsin — u xatolarni o&apos;zi sanaydi. So&apos;ng
              havolani quyidagi maydonga tashlang.
            </li>
          </ol>
          <p className="s-imp__lead" style={{ margin: "12px 0 0" }}>
            Shablon har safar yangidan yig&apos;iladi: davlat va shahar
            ro&apos;yxatlari hozirgi bazadan olinadi, shuning uchun mijoz
            mavjud bo&apos;lmagan joyni tanlay olmaydi. Varaqlar:{" "}
            <b>Boshlash</b>, <b>Turlar</b>, <b>Kunlar</b>, <b>Narx</b>,{" "}
            <b>Sanalar</b>, <b>Rasmlar</b>, <b>Tekshiruv</b>. Nomlari
            o&apos;zgarmasligi shart.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <a className="s-btn s-btn--primary" href={TEMPLATE} download>
              <IconDownload />
              Shablonni yuklab olish (.xlsx)
            </a>
            <a
              className="s-btn"
              href="https://drive.google.com/drive/my-drive"
              target="_blank"
              rel="noreferrer"
            >
              <IconExternal />
              Google Drive
            </a>
          </div>
        </div>
      </section>

      <section className="s-card">
        <div className="s-card__body">
          <h2 className="s-imp__h">2. Jadval havolasi</h2>
          <Field
            label="Google Sheets havolasi"
            help="Brauzer manzil qatoridagi havolani nusxalang: https://docs.google.com/spreadsheets/d/..."
          >
            <input
              className="s-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              spellCheck={false}
            />
          </Field>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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
                  if (
                    confirm(
                      `${ready.length} ta tur bazaga yoziladi. Davom etamizmi?`,
                    )
                  )
                    run("commit");
                }}
              >
                {busy === "commit"
                  ? "Import qilinmoqda…"
                  : `${ready.length} ta turni import qilish`}
              </button>
            )}
          </div>
          {error && <div className="s-imp__fatal">{error}</div>}
        </div>
      </section>

      {report && (
        <section className="s-card">
          <div className="s-card__body">
            <h2 className="s-imp__h">
              {done ? "3. Natija" : "3. Tekshiruv natijasi"}
            </h2>

            {!done && (
              <p className="s-imp__lead">
                Hech narsa hali yozilmadi.{" "}
                {ready.length > 0
                  ? `${ready.length} ta tur tayyor${blocked.length ? `, ${blocked.length} tasida xato bor` : ""}.`
                  : "Import qilinadigan tur yo'q — quyidagi xatolarni to'g'rilang."}
              </p>
            )}

            {fatal.map((i, n) => (
              <div key={`f${n}`} className="s-imp__fatal">
                {i.message}
              </div>
            ))}

            {report.plans.length > 0 && (
              <div className="s-imp__list">
                {report.plans.map((p) => {
                  const outcome = report.outcomes?.find((o) => o.slug === p.slug);
                  return (
                    <div key={`${p.slug}-${p.row}`} className="s-imp__row">
                      <div className="s-imp__rowhead">
                        <span className="s-imp__title">{p.title}</span>
                        <code className="s-imp__slug">{p.slug}</code>
                        {outcome ? (
                          <span
                            className={`s-badge ${outcome.ok ? "s-badge--green" : "s-badge--gray"}`}
                          >
                            {outcome.action === "created"
                              ? "Qo'shildi"
                              : outcome.action === "updated"
                                ? "Yangilandi"
                                : "Bajarilmadi"}
                          </span>
                        ) : (
                          <span
                            className={`s-badge ${
                              p.action === "create"
                                ? "s-badge--green"
                                : p.action === "update"
                                  ? "s-badge--teal"
                                  : "s-badge--gray"
                            }`}
                          >
                            {p.action === "create"
                              ? "Yangi"
                              : p.action === "update"
                                ? "Yangilanadi"
                                : "Xato"}
                          </span>
                        )}
                      </div>

                      <div className="s-imp__stats">
                        {p.stats.days} kun · {p.stats.cities} shahar ·{" "}
                        {p.stats.included}/{p.stats.excluded} band ·{" "}
                        {p.stats.departures} sana · {p.stats.images} rasm ·{" "}
                        {p.row}-qator
                      </div>

                      {p.errors.map((e, n) => (
                        <div key={`e${n}`} className="s-imp__msg s-imp__msg--err">
                          <IconX width={13} height={13} />
                          {e}
                        </div>
                      ))}
                      {p.warnings.map((w, n) => (
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
            )}

            {report.issues.filter((i) => i.level === "warning").length > 0 && (
              <div className="s-imp__notes">
                <div className="s-imp__noteshead">Jadval bo&apos;yicha eslatmalar</div>
                {report.issues
                  .filter((i) => i.level === "warning")
                  .map((i, n) => (
                    <div key={`n${n}`} className="s-imp__msg s-imp__msg--warn">
                      {i.tab}
                      {i.row ? ` ${i.row}-qator` : ""}: {i.message}
                    </div>
                  ))}
              </div>
            )}

            {done && (
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Link className="s-btn s-btn--primary" href="/studio/tours">
                  <IconCheck />
                  Turlar ro&apos;yxatiga o&apos;tish
                </Link>
                <button className="s-btn" onClick={() => run("preview")}>
                  Jadvalni qayta tekshirish
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
