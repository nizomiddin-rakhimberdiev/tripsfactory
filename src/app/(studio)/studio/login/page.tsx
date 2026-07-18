import { redirect } from "next/navigation";
import { getStudioUser } from "@/lib/studio/auth";
import { LoginForm } from "@/components/studio/LoginForm";

export const dynamic = "force-dynamic";

export default async function StudioLoginPage() {
  const user = await getStudioUser();
  if (user) redirect("/studio");
  return <LoginForm />;
}
