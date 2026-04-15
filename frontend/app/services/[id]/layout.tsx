import { Metadata } from 'next';
import { servicesAPI } from '@/lib/api';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const serviceId = decodeURIComponent(params.id);
  
  try {
    // Note: On the server, we need the full URL if we're fetching from our own API
    // but here we can assume the API is reachable or have a fallback.
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/services/${serviceId}`);
    
    if (!res.ok) throw new Error('Failed to fetch service');
    
    const service = await res.json();
    const title = `${service.title} | Digital Point`;
    const description = service.description ? 
      (service.description.length > 160 ? service.description.substring(0, 157) + '...' : service.description) : 
      'Discover trusted local service providers on Digital Point.';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: service.image_url ? [service.image_url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Service Detail | Digital Point',
      description: 'Discover trusted local service providers.',
    };
  }
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
