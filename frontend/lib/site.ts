const normalizeUrl = (value: string) => value.replace(/\/$/, '');

const computeSiteUrl = () => {
  const explicit = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (explicit) return normalizeUrl(explicit);

  const vercel = (process.env.VERCEL_URL || '').trim();
  if (vercel) return normalizeUrl(`https://${vercel}`);

  return 'https://digitalpointllc.online';
};

export const SITE_URL = computeSiteUrl();
