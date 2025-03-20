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
  };
  
  module.exports = nextConfig;
  