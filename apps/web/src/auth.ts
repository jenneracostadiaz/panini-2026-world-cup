import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        try {
          const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) return null;
          const data = (await res.json()) as {
            token: string;
            user: { id: string; email: string };
          };
          return {
            id: data.user.id,
            email: data.user.email,
            apiToken: data.token,
          };
        } catch (err) {
          console.error("[auth] login fetch failed", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.apiToken = (user as { apiToken?: string }).apiToken;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
      }
      session.apiToken = token.apiToken as string | undefined;
      return session;
    },
  },
});
