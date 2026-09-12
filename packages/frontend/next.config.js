const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ai-interview-prep/shared"],
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
    turbo: {
      root: path.join(__dirname, "../../"),
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://ai-interview-prep-9cu6.onrender.com/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
