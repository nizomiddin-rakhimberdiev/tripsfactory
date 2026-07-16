import createProxy from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createProxy(routing);

export const config = {
  // Skip API routes, Payload admin, Next internals and static files
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
