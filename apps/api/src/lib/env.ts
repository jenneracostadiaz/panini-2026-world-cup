import { z } from "zod";

export type AuthUser = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

export type AppEnv = {
  Variables: {
    user: AuthUser;
  };
};

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 chars"),
  PORT: z.coerce.number().int().positive().default(3001),
  ALLOWED_ORIGIN: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "[env] invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
