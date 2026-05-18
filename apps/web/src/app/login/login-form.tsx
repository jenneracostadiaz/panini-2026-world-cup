"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setSubmitting(false);
    if (!res || res.error) {
      setError("Credenciales inválidas");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>

        <label className="block">
          <span className="block text-sm font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>

        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
