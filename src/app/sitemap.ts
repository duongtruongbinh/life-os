import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        { url: BASE_URL, lastModified: new Date(), priority: 1 },
        { url: `${BASE_URL}/login`, lastModified: new Date(), priority: 0.5 },
    ];
}
