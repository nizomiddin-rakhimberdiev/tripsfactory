import Link from "next/link";
import { getPayloadClient } from "@/lib/studio/auth";
import { QrSheet, type SheetCode } from "@/components/studio/QrSheet";
import { IconChevron } from "@/components/studio/icons";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * The sheet that goes to the print shop.
 *
 * `?only=stock` is the usual case — the codes minted for a print run that no
 * hotel is attached to yet.
 */
export default async function PartnerPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ only?: string }>;
}) {
  const { only } = await searchParams;
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "partners",
    where: only === "stock" ? { assigned: { not_equals: true } } : {},
    limit: 300,
    depth: 0,
    sort: "code",
  });

  const codes: SheetCode[] = res.docs.map((p) => ({
    code: p.code,
    name: p.name,
    assigned: p.assigned !== false,
  }));

  return (
    <>
      <div className="s-pagehead s-print-hide">
        <div className="s-pagehead__text">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "var(--s-fg-muted)",
              fontSize: 13,
              marginBottom: 2,
            }}
          >
            <Link
              href="/studio/partners"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Hamkorlar
            </Link>
            <IconChevron width={14} height={14} />
          </div>
          <h1>QR kodlarni chop etish</h1>
          <p>
            {codes.length} ta kod.{" "}
            {only === "stack" || only === "stock"
              ? "Faqat hali biriktirilmaganlari."
              : "Barchasi."}{" "}
            <Link
              href={
                only === "stock"
                  ? "/studio/partners/print"
                  : "/studio/partners/print?only=stock"
              }
              className="s-rowlink"
            >
              {only === "stock" ? "Barchasini ko'rsatish" : "Faqat zaxiradagilar"}
            </Link>
          </p>
        </div>
      </div>

      {codes.length === 0 ? (
        <div className="s-table-wrap s-print-hide">
          <div className="s-empty">
            Chop etadigan kod yo&apos;q. Hamkorlar sahifasida «QR partiyasi»
            yarating.
          </div>
        </div>
      ) : (
        <QrSheet codes={codes} origin={SITE_URL} />
      )}
    </>
  );
}
