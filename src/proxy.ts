import createProxy from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createProxy(routing);

export const config = {
  // Skip API routes, Payload admin, the bespoke Studio, Next internals & static files
  matcher: "/((?!api|admin|studio|_next|_vercel|.*\\..*).*)",
};
