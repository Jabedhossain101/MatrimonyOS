import { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/demo-data";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const staticDate = new Date("2026-11-03T00:00:00.000Z");

  const staticRoutes = [
    "",
    "/about",
    "/how-it-works",
    "/pricing",
    "/success-stories",
    "/blog",
    "/contact",
    "/faq",
    "/privacy",
    "/terms",
    "/cookies",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: staticDate,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const blogRoutes = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: staticDate,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
