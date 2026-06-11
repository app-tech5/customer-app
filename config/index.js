import { assetUrls } from './assets';

export const config = {
  API_BASE_URL: 'http://localhost:5000/api',
  FALLBACK_STRIPE_PUBLISHABLE_KEY: '',
  APP_NAME: 'Good Food',
  VERSION: '1.1.0',

  DEMO_MODE: true,
  DEMO_EMAIL: 'demo@customer.com',
  DEMO_PASSWORD: 'demo123',

  API_TIMEOUT: 10000,
  MAPTILER_API_KEY: '',

  assetUrls,
};

export const PUBLIC_UPLOAD_FOLDERS = {
  AVATARS: 'avatars',
};

export { assetUrls };

