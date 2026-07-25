import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /admin and /studio were crawlable, which put the two sign-in screens in
      // search results and pointed anyone looking for a way in straight at them.
      disallow: ["/api/", "/admin", "/studio"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
