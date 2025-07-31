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
};

export default nextConfig;
