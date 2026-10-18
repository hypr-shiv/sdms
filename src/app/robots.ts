import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/privacy"],
      disallow: ["/dashboard/", "/api/"],
    },
    sitemap: "https://scholarpulse.com/sitemap.xml",
  };
}
