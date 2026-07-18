import { requireStudioUser, getPayloadClient } from "@/lib/studio/auth";
import { Shell } from "@/components/studio/Shell";

export const dynamic = "force-dynamic";

export default async function StudioAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStudioUser();
  const payload = await getPayloadClient();
  const newLeads = await payload
    .count({ collection: "leads", where: { status: { equals: "new" } } })
    .then((r) => r.totalDocs)
    .catch(() => 0);

  return (
    <Shell email={user.email} newLeads={newLeads}>
      {children}
    </Shell>
  );
}
