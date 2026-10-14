import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env from multiple potential candidate locations
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'trajectory/.env'),
  path.resolve(process.cwd(), 'trajectory/server/.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '../.env'),
];
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const schema = z.object({
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/trajectory'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 chars')
    .default('development_jwt_access_secret_trajectory_platform_minimum_32_chars_long_key_sample'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 chars')
    .default('development_jwt_refresh_secret_trajectory_platform_minimum_32_chars_long_key_sample'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  LLM_PROVIDER: z.enum(['gemini', 'openai', 'ollama', 'mock']).default('gemini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  OLLAMA_BASE_URL: z.string().optional(),
  OLLAMA_MODEL: z.string().default('llama3'),
  ML_SERVICE_URL: z.string().default('http://localhost:8000'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z.string().transform((v) => v === 'true').default('false'),
  COOKIE_SAME_SITE: z.string().transform((v) => v.toLowerCase() as 'strict' | 'lax' | 'none').default('strict'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
