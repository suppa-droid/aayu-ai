/** @type {import('next').NextConfig} */
const defaultRuntimeCaching = require('next-pwa/cache');

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // Authenticated API calls must wait out a cold start. The default
      // cross-origin rule gives up after 10 seconds and looks like an empty list.
      urlPattern: ({ url }) => url.pathname.includes('/api/') || url.hostname.includes('onrender.com'),
      handler: 'NetworkOnly',
    },
    ...defaultRuntimeCaching,
  ],
});

const isDev = process.env.NODE_ENV !== 'production';
const defaultApi =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (isDev ? 'http://localhost:8000/api/v1' : 'https://aayu-ai-backendsamo.onrender.com/api/v1');

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: defaultApi,
  },
};

module.exports = withPWA(nextConfig);
