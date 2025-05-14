/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wordpress-1269066-4577871.cloudwaysapps.com",
      },
    ],
  },
  transpilePackages: [],
  experimental: {
    forceSwcTransforms: true, // Force SWC transforms to be used
  },
};

export default nextConfig;
