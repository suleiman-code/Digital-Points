import { servicesAPI } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export async function GET() {
  const baseUrl = SITE_URL;
  
  // Fetch all services
  let services = [];
  try {
    const res = await servicesAPI.getAll();
    services = res.data || [];
  } catch (e) {
    console.error("Sitemap fetch failed");
  }

  const staticRoutes = ["", "/services", "/about", "/contact", "/privacy", "/terms"];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticRoutes.map(route => `
        <url>
          <loc>${baseUrl}${route}</loc>
          <changefreq>daily</changefreq>
          <priority>${route === "" ? "1.0" : "0.8"}</priority>
        </url>
      `).join('')}
      ${services.map((svc: any) => `
        <url>
          <loc>${baseUrl}/services/${encodeURIComponent(svc._id || svc.id || '')}</loc>
          <lastmod>${new Date(svc.updated_at || svc.updatedAt || Date.now()).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
      `).join('')}
    </urlset>
  `;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
