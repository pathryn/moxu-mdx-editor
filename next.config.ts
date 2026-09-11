import type { NextConfig } from "next";

const embedOrigins = (process.env.NEXT_PUBLIC_MDX_EMBED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean)
  .map((host) => `https://${host}`)
  .join(" ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      `frame-src 'self' ${embedOrigins}`.trim(),
      "img-src 'self' data: https:",
      "media-src 'self' https:",
      "connect-src 'self'",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "form-action 'self'",
    ].join("; ");
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }];
  },
};

export default nextConfig;
