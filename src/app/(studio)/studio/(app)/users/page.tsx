import { getPayloadClient, requireStudioUser } from "@/lib/studio/auth";
import { ToastProvider } from "@/components/studio/ui";
import { UsersManager } from "@/components/studio/UsersManager";

export const dynamic = "force-dynamic";

export default async function StudioUsersPage() {
  // Needed for its email, not only for the gate: the row for whoever is signed
  // in must not offer a delete button.
  const me = await requireStudioUser();
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "users",
    limit: 100,
    depth: 0,
    sort: "createdAt",
  });

  const users = res.docs.map((u) => ({
    id: u.id,
    email: u.email,
    createdAt: u.createdAt,
  }));

  return (
    <ToastProvider>
      <div className="s-pagehead">
        <div className="s-pagehead__text">
          <h1>Foydalanuvchilar</h1>
          <p>
            Studioga kira oladigan hisoblar. {users.length} ta hisob bor.
          </p>
        </div>
      </div>
      <UsersManager initial={users} currentEmail={me.email} />
    </ToastProvider>
  );
}
