/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        ignoreBuildErrors: true,
    },
    experimental: {
        serverComponentsExternalPackages: ['next-auth-steam', 'openid'],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Don't resolve 'fs', 'net', 'tls' modules on the client
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };
        }
        return config;
    },
};

module.exports = nextConfig;
