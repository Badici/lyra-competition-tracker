import type { MetadataRoute } from "next";

const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lyra-competition-tracker.ro";
const normalizedSiteUrl = rawSiteUrl.startsWith("http")
  ? rawSiteUrl
  : `https://${rawSiteUrl}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/dashboard", "/competition/"],
        disallow: ["/admin/", "/api/", "/login"],
      },
    ],
    sitemap: `${normalizedSiteUrl}/sitemap.xml`,
  };
}
