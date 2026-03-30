import { MetadataRoute } from "next";
import { translations } from "../lib/translations";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://grolab.app";
  const posts = translations.tr.blog.posts;
  const featuredSlug = translations.tr.blog.featuredPost.title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blog/${featuredSlug}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
