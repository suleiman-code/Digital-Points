'use client';

import { useEffect } from 'react';

const META_MASK_EXTENSION_ID = 'nkbihfbeogaeaoehlefnkodbefgpgknn';

const toText = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack || ''}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const isMetaMaskNoise = (message: string, source?: string) => {
  const text = `${message} ${source || ''}`.toLowerCase();
  return (
    text.includes('metamask') ||
    text.includes('failed to connect to metamask') ||
    text.includes(`chrome-extension://${META_MASK_EXTENSION_ID}`) ||
    text.includes('inpage.js')
  );
};

export default function IgnoreExtensionErrors() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = toText(event.error || event.message);
      if (isMetaMaskNoise(message, event.filename)) {
        event.preventDefault();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = toText(event.reason);
      if (isMetaMaskNoise(message)) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
