import type { NextConfig } from "next";

// The essays were imported from the previous Framer site, which served them
// at /blog/<slug>; those links live on in search results and shares, so they
// redirect permanently to the /writing pages. One slug lost its parentheses
// on import (escaped here: the characters are regex syntax in `source`;
// the percent-encoded form is matched as sent, so it gets its own rule).
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  // Baseline hardening for a static site: no sniffing, no framing, a
  // conservative referrer, and no access to device features.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source:
          "/blog/how-i-actually-use-ai-in-real-projects-\\(without-the-hype\\)",
        destination:
          "/writing/how-i-actually-use-ai-in-real-projects-without-the-hype",
        permanent: true,
      },
      {
        // The same link with the parentheses percent-encoded.
        source:
          "/blog/how-i-actually-use-ai-in-real-projects-%28without-the-hype%29",
        destination:
          "/writing/how-i-actually-use-ai-in-real-projects-without-the-hype",
        permanent: true,
      },
      { source: "/blog/:slug", destination: "/writing/:slug", permanent: true },
      { source: "/blog", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
