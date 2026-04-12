import { assetUrls } from './assets';

export const config = {
  API_BASE_URL: 'http://localhost:5000/api',
  FALLBACK_STRIPE_PUBLISHABLE_KEY: 'pk_test_51TIcAILenxtQOhEhEjwR6VWyKw9h6jmOwMSOVIxdXpwnA7mAi9pDy08Dgk8cVvk3QC1lVpAxD2LKgIODDlK5Y22U00xCwBf9ok',
  APP_NAME: 'Good Food',
  VERSION: '1.1.0',

  DEMO_MODE: false,
  DEMO_EMAIL: 'demo@customer.com',
  DEMO_PASSWORD: 'demo123',

  API_TIMEOUT: 10000,

  assetUrls,
};

export { assetUrls };

