import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [{
            protocol: 'https',
            hostname: 'kwbdpkiqncgpcdnmejwr.supabase.co',
            port: '',
            pathname: '/**',
        }]
    },
    experimental: {
        serverActions: {
            allowedOrigins: [
                '*.app.github.dev',
                'localhost:3000'
            ]
        }
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: 'upgrade-insecure-requests',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;