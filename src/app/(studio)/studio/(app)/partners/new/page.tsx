import Link from "next/link";
import { ToastProvider } from "@/components/studio/ui";
import {
  PartnerEditor,
  type PartnerInitial,
} from "@/components/studio/PartnerEditor";
import { IconChevron } from "@/components/studio/icons";

export const dynamic = "force-dynamic";

/** `id: null` is what tells the editor to create rather than update on save. */
const EMPTY: PartnerInitial = {
  id: null,
  name: "",
  code: "",
  type: "hotel",
  // The rate in the B2B proposal. Editable per partner, because the second
  // hotel always negotiates.
  commissionUsd: 15,
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  active: true,
  notes: "",
};

export default function NewPartnerPage() {
  return (
    <ToastProvider>
      <div className="s-pagehead">
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
          <h1>Yangi hamkor</h1>
        </div>
      </div>
      <PartnerEditor initial={EMPTY} />
      <p
        style={{
          marginTop: 14,
          fontSize: 12.5,
          color: "var(--s-fg-muted)",
        }}
      >
        Saqlaganingizdan keyin QR kod shu sahifada paydo bo&apos;ladi.
      </p>
    </ToastProvider>
  );
}
