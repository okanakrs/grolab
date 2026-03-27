/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "https", hostname: "www.reddit.com" },
      { protocol: "https", hostname: "news.ycombinator.com" },
      { protocol: "https", hostname: "ph-static.imgix.net" },
      { protocol: "https", hostname: "www.apple.com" },
    ],
  },
};

export default nextConfig;
