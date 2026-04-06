export async function GET() {
  const baseUrl = "http://localhost:3000"; // Replace with your production URL later
  
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
