import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);
/** pnpm monorepo root so Turbopack resolves `next` from the workspace */
const monorepoRoot = path.resolve(dirname, '../..');

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:5173' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return webpackConfig;
  },
  turbopack: {
    root: monorepoRoot,
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
