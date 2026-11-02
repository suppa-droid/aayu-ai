/** @type {import('next').NextConfig} */
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

module.exports = nextConfig;
