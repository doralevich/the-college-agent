import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // proxy.ts matches /api/agents/:path* — which now includes the chat file-upload route.
    // The proxy body cap defaults to 10MB and SILENTLY TRUNCATES larger bodies, which would
    // corrupt attachments. Raise it so real files (the Agents API multipart cap is generous)
    // pass through intact.
    proxyClientMaxBodySize: "25mb",
  },
  async redirects() {
    return [
      { source: "/affiliate", destination: "/ambassador", permanent: true },
    ];
  },
};

export default nextConfig;
