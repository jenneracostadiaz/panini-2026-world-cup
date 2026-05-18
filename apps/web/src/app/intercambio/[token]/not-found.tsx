export default function ExchangeNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl" aria-hidden>
        🔍
      </p>
      <h1 className="text-2xl font-bold">Link no válido o expirado</h1>
      <p className="text-base text-muted-foreground">
        Este link de intercambio no existe o fue desactivado. Pedile al
        coleccionista que te comparta un link actualizado.
      </p>
    </main>
  );
}
