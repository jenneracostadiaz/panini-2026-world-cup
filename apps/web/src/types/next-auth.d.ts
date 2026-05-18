import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    apiToken?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    apiToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    apiToken?: string;
  }
}
