import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rajani.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: vendors } = await supabase.from("vendors").select("slug, updated_at").eq("status", "live");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/discover`, changeFrequency: "hourly", priority: 0.9 },
  ];

  const vendorRoutes: MetadataRoute.Sitemap = (vendors ?? []).map((v) => ({
    url: `${siteUrl}/vendors/${v.slug}`,
    lastModified: v.updated_at,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...vendorRoutes];
}
