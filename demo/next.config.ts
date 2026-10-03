import type { NextConfig } from "next";

type AudioWebpackConfig = {
  module: {
    rules: {
      test: RegExp;
      type: string;
      generator: { filename: string };
    }[];
  };
};

const config: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
  // NOTE: Imported MP3 files use webpack's asset modules. The demo commands
  // select webpack to preserve their URL export contract.
  webpack: (webpackConfig: AudioWebpackConfig) => {
    webpackConfig.module.rules.push({
      test: /\.(mp3)$/u,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[path][name].[hash][ext]",
      },
    });
    return webpackConfig;
  },
};

export default config;
