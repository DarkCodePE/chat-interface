/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                // Headers para todas las rutas
                source: '/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                ],
            },
            {
                // Headers específicos para la página de embed
                source: '/embed',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "frame-ancestors 'self' https://* http://* file://*",
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'ALLOWALL',
                    },
                ],
            },
            {
                // Headers específicos para el script embed.js
                source: '/embed.js',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Content-Type',
                        value: 'application/javascript',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
