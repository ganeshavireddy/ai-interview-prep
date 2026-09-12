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
        destination: "http://localhost:8099/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
