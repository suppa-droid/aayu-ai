/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://aayu-ai-backendsamo.onrender.com/api/v1',
  },
};

module.exports = nextConfig;
