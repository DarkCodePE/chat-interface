/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async headers() {
        return [
            {
                // This applies to all routes
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        // Allow embedding in iframes
                        value: 'SAMEORIGIN',
                    },
                    {
                        // Required for cross-domain iframe communication
                        key: 'Content-Security-Policy',
                        value: "frame-ancestors 'self' *"
                    }
                ],
            },
            {
                // Special case for the embed route to allow embedding anywhere
                source: '/embed',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'ALLOWALL',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "frame-ancestors *"
                    }
                ],
            },
        ];
    },
};

export default nextConfig;
