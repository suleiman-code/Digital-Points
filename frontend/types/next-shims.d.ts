declare module 'next' {
  export type Metadata = Record<string, any>;
}

declare module 'next/link' {
  import * as React from 'react';
  const Link: React.ComponentType<any>;
  export default Link;
}

declare module 'next/image' {
  import * as React from 'react';
  const Image: React.ComponentType<any>;
  export default Image;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (href: string) => void;
    replace: (href: string) => void;
    refresh: () => void;
    back: () => void;
    forward: () => void;
    prefetch: (href: string) => Promise<void>;
  };
  export function useSearchParams(): {
    get: (name: string) => string | null;
  };
  export function usePathname(): string;
}

declare module 'next/*' {
  const NextModule: any;
  export = NextModule;
}
