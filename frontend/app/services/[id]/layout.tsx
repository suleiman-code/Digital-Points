import { Metadata } from 'next';

/** Server-only: must not import `@/lib/api` here (large client bundle + storage side effects). */
function getServerApiBase(): string {
  let raw = (process.env.NEXT_PUBLIC_API_URL || 'https://digitalpointllc.online/api').trim().replace(/\/$/, '');
  if (raw && !raw.startsWith('http')) {
    raw = `https://${raw}`;
  }
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

const stripHtml = (s: string) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const serviceId = decodeURIComponent(params.id);

  try {
    const res = await fetch(`${getServerApiBase()}/services/${serviceId}`, {
      next: { revalidate: 120 },
    });

    if (!res.ok) throw new Error('Failed to fetch service');

    const service = await res.json();
    const title = `${service.title} | Digital Point`;
    const plainDesc = stripHtml(String(service.description || ''));
    const description =
      plainDesc.length > 160 ? `${plainDesc.slice(0, 157)}...` : plainDesc || 'Discover trusted local service providers on Digital Point.';

    const apiBase = getServerApiBase();
    const origin = apiBase.replace(/\/api\/?$/, '');
    const rawImg = service.image_url ? String(service.image_url).trim() : '';
    const ogImage =
      rawImg &&
      (rawImg.startsWith('http') ? rawImg : `${origin}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
    };
  } catch {
    return {
      title: 'Service Detail | Digital Point',
      description: 'Discover trusted local service providers.',
    };
  }
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
