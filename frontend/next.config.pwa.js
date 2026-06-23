// Install: npm i next-pwa
// Rename this file to next.config.js (merge with existing)
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.nexuscrm\.io\/v1\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 3600 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
});
