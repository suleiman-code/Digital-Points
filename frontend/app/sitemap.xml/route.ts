import { servicesAPI } from "@/lib/api";

export async function GET() {
  const baseUrl = "http://localhost:3000"; // Replace with your production URL later
  
  // Fetch all services
  let services = [];
  try {
    const res = await servicesAPI.getAll();
    services = res.data || [];
  } catch (e) {
    console.error("Sitemap fetch failed");
  }

  const staticRoutes = ["", "/services", "/contact", "/admin/login"];
  
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
          <loc>${baseUrl}/services/${svc._id}</loc>
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
    },
  });
}
