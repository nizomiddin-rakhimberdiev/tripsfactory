import "server-only";
import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import type { User } from "@/payload-types";

export async function getStudioUser(): Promise<User | null> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await nextHeaders() });
  return (user as User | null) ?? null;
}

/** Gate a Studio server component; redirects to login when signed out. */
export async function requireStudioUser(): Promise<User> {
  const user = await getStudioUser();
  if (!user) redirect("/studio/login");
  return user;
}

export async function getPayloadClient() {
  return getPayload({ config });
}
