/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Backend API serves frame thumbnails from a dynamic host (localhost in dev, deployed URL in prod).
    // Wildcard hostname covers both without hardcoding the env-specific URL here.
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  swcMinify: true,
  typescript: {
    // Type check during build
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    // Run ESLint on production builds
    dirs: ['app', 'pages', 'components', 'lib', 'utils'],
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
