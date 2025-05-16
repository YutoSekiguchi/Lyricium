import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    API_URL: process.env.MODE=="production" ? process.env.API_URL_PROD : process.env.API_URL_DEV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  }
};

export default nextConfig;
