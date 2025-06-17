/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  images: {
    domains: ["lh3.googleusercontent.com", "www.google.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
        pathname: "**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;
