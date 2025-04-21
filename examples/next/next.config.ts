import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { NextConfig } from "next";
import path from "path";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error("Please set the `OPENROUTER_API_KEY` environment variable.");
}

const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
});
const openrouterModel = openrouter("meta-llama/llama-4-maverick:free");

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.txt$/,
      use: "raw-loader",
    });

    config.module.rules.push({
      test: /__prompt\.[0-9a-zA-Z]+$/,
      use: [
        {
          loader: path.resolve(__dirname, "..", "..", "dist", "index.js"),
          options: {
            model: openrouterModel,
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
