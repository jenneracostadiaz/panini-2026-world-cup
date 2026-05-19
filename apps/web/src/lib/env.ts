import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXTAUTH_SECRET: z
    .string()
    .min(8, "NEXTAUTH_SECRET must be at least 8 chars")
    .or(
      z
        .string()
        .min(8)
        .describe("AUTH_SECRET alias"),
    ),
  NEXTAUTH_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const source = {
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "",
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "",
};

const parsed = schema.safeParse(source);
if (!parsed.success) {
  console.error(
    "[env] invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
