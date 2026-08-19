import { assetUrls } from './assets';

export const config = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
  FALLBACK_STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  APP_NAME: 'Good Food',
  VERSION: '1.1.0',

  DEMO_MODE: process.env.EXPO_PUBLIC_DEMO_MODE !== 'false',
  DEMO_EMAIL: process.env.EXPO_PUBLIC_DEMO_EMAIL || 'demo@customer.com',
  DEMO_PASSWORD: process.env.EXPO_PUBLIC_DEMO_PASSWORD || 'demo123',

  API_TIMEOUT: 10000,
  // Map provider: 'osm' (default, free) | 'maptiler' | 'mapbox' | 'google'
  MAP_PROVIDER: process.env.EXPO_PUBLIC_MAP_PROVIDER || 'osm',
  MAPTILER_API_KEY: process.env.EXPO_PUBLIC_MAPTILER_API_KEY || '',
  MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',

  assetUrls,
};

export const PUBLIC_UPLOAD_FOLDERS = {
  AVATARS: 'avatars',
};

export { assetUrls };

