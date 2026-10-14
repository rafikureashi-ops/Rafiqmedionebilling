export interface BrandAssets {
  logoUrl: string;
  splashUrl: string;
}

const BRAND_LOGO_KEY = 'mob_brand_logo';
const BRAND_SPLASH_KEY = 'mob_brand_splash';

type Listener = (assets: BrandAssets) => void;
const listeners: Set<Listener> = new Set();

let currentAssets: BrandAssets = {
  logoUrl: typeof window !== 'undefined' ? (localStorage.getItem(BRAND_LOGO_KEY) || '/logo.png') : '/logo.png',
  splashUrl: typeof window !== 'undefined' ? (localStorage.getItem(BRAND_SPLASH_KEY) || '/splash.jpg') : '/splash.jpg',
};

export const BrandStore = {
  getAssets(): BrandAssets {
    return currentAssets;
  },

  getLogo(): string {
    return currentAssets.logoUrl;
  },

  getSplash(): string {
    return currentAssets.splashUrl;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener(currentAssets);
    return () => {
      listeners.delete(listener);
    };
  },

  notify(): void {
    listeners.forEach(fn => fn(currentAssets));
  },

  async init(): Promise<BrandAssets> {
    try {
      const res = await fetch('/api/brand/assets');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.assets) {
          // If server has updated assets, use them
          if (data.assets.logoUrl) currentAssets.logoUrl = data.assets.logoUrl;
          if (data.assets.splashUrl) currentAssets.splashUrl = data.assets.splashUrl;
          if (typeof window !== 'undefined') {
            localStorage.setItem(BRAND_LOGO_KEY, currentAssets.logoUrl);
            localStorage.setItem(BRAND_SPLASH_KEY, currentAssets.splashUrl);
          }
          BrandStore.notify();
        }
      }
    } catch {
      // Offline fallback: keep localStorage assets
    }
    return currentAssets;
  },

  async updateAssets(updates: { logoUrl?: string; splashUrl?: string }): Promise<BrandAssets> {
    if (updates.logoUrl) {
      currentAssets.logoUrl = updates.logoUrl;
      if (typeof window !== 'undefined') localStorage.setItem(BRAND_LOGO_KEY, updates.logoUrl);
    }
    if (updates.splashUrl) {
      currentAssets.splashUrl = updates.splashUrl;
      if (typeof window !== 'undefined') localStorage.setItem(BRAND_SPLASH_KEY, updates.splashUrl);
    }
    BrandStore.notify();

    // Persist to server
    try {
      await fetch('/api/brand/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoData: updates.logoUrl,
          splashData: updates.splashUrl,
        }),
      });
    } catch (err) {
      console.warn('Could not persist brand assets to server (offline mode active):', err);
    }

    return currentAssets;
  },

  async reset(): Promise<BrandAssets> {
    currentAssets = {
      logoUrl: '/logo.png',
      splashUrl: '/splash.jpg',
    };
    if (typeof window !== 'undefined') {
      localStorage.removeItem(BRAND_LOGO_KEY);
      localStorage.removeItem(BRAND_SPLASH_KEY);
    }
    BrandStore.notify();

    try {
      await fetch('/api/brand/reset', { method: 'POST' });
    } catch (err) {
      console.warn('Could not reset on server:', err);
    }

    return currentAssets;
  },

  readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
