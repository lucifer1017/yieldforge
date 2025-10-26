/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Disable to prevent double submissions in dev
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };
        return config;
    },
};

module.exports = nextConfig;
