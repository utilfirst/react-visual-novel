import type { NextConfig } from "next";

const config: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
};

export default config;
