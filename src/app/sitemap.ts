import type { MetadataRoute } from "next";
import { articleUrl, essays, siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...essays.map((article) => ({
      url: articleUrl(article),
      lastModified: new Date(`${article.isoDate}T12:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
