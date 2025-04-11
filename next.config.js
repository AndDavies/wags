/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "source.unsplash.com",
          port: "",
          pathname: "/**",
        },
      ],
      domains: ["auqyngiwrzjwylzylxtb.supabase.co"],
    },
    reactStrictMode: true,
    // Disable TypeScript build errors
    typescript: {
      // Dangerously allow production builds to successfully complete even if
      // your project has type errors
      ignoreBuildErrors: true,
    },
    // Disable ESLint build errors
    eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: true,
    },
  };
  
  module.exports = nextConfig;
  