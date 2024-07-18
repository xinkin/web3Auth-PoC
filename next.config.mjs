/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@web3auth/no-modal', '@web3auth/base', '@web3auth/ethereum-provider'],
}

export default nextConfig;