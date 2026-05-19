"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/api";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      if (res.status === 409) {
        setError("Este email ya está registrado");
        return;
      }
      if (!res.ok) {
        const body = (await res
          .json()
          .catch(() => ({}))) as { error?: string };
        setError(body.error ?? "No se pudo crear la cuenta");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!signInResult || signInResult.error) {
        setError(
          "Cuenta creada pero falló el inicio de sesión. Probá iniciar sesión manualmente.",
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error desconocido",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded border border-neutral-300 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        <h1 className="text-2xl font-bold">Crear cuenta</h1>

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
          <span className="block text-sm font-medium">
            Contraseña{" "}
            <span className="text-xs text-neutral-500">(mín. 8 caracteres)</span>
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium">Confirmar contraseña</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
          {submitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>

        <p className="pt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="font-medium underline hover:no-underline"
          >
            Iniciá sesión
          </Link>
        </p>
      </form>
    </main>
  );
}
