/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
          // Type-checking still runs during the build; ESLint is skipped here so a
      // missing/mismatched lint-plugin resolution on the host (as happened on
      // Vercel with @typescript-eslint) can't block an otherwise-valid build.
      // Run `npm run lint` locally/in CI if you want lint enforcement.
      ignoreDuringBuilds: true,
    },
    images: {
          remotePatterns: [
            { protocol: "https", hostname: "*.supabase.co" },
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
                ],
    },
};

export default nextConfig;
