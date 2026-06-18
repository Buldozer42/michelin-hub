import type { NextConfig } from "next";

const backendOrigin =
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.replace(/\/+$/, "") ??
    (process.env.NODE_ENV === "production"
        ? "https://michelin-hub.onrender.com"
        : "http://localhost:8000");

const nextConfig: NextConfig = {
    allowedDevOrigins: ["192.168.1.18"],
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${backendOrigin}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
