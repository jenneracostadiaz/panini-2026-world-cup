"use client";

import { Download, Loader2, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

type ImportEntry = {
  stickerId: string;
  status: "owned" | "missing";
  quantity: number;
};

type Preview = {
  fileName: string;
  count: number;
  entries: ImportEntry[];
} | null;

type ImportResult = {
  imported: number;
  errors: string[];
};

export function ImportClient() {
  const { data: session } = useSession();
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [preview, setPreview] = useState<Preview>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onExport() {
    setExporting(true);
    try {
      const res = await apiFetch(
        "/api/collection/export",
        { cache: "no-store" },
        session,
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `panini-collection-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setLastExportedAt(new Date().toISOString());
    } catch (err) {
      console.error("[import] export failed", err);
    } finally {
      setExporting(false);
    }
  }

  async function onFile(file: File) {
    setParseError(null);
    setResult(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        collection?: ImportEntry[];
      };
      if (!Array.isArray(parsed.collection)) {
        throw new Error("Formato inválido: falta 'collection'");
      }
      setPreview({
        fileName: file.name,
        count: parsed.collection.length,
        entries: parsed.collection,
      });
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Archivo inválido");
      setPreview(null);
    }
  }

  async function onImport() {
    if (!preview) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await apiFetch(
        "/api/collection/import",
        {
          method: "POST",
          body: JSON.stringify({ collection: preview.entries }),
        },
        session,
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      setResult((await res.json()) as ImportResult);
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "Error al importar",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Exportar colección</CardTitle>
          <CardDescription>
            Descargá tu colección actual como archivo JSON.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button type="button" onClick={onExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Descargar JSON
          </Button>
          {lastExportedAt ? (
            <p className="text-xs text-muted-foreground">
              Último export:{" "}
              {new Date(lastExportedAt).toLocaleString("es", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importar colección</CardTitle>
          <CardDescription>
            Subí un JSON generado por la app para restaurar tu álbum.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <DropZone onFile={onFile} />
          {parseError ? (
            <p role="alert" className="text-sm text-destructive">
              {parseError}
            </p>
          ) : null}
          {preview ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{preview.fileName}</p>
              <p className="text-xs text-muted-foreground">
                Se importarán {preview.count} figuritas.
              </p>
              <Button
                className="mt-3"
                onClick={onImport}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Confirmar importación
              </Button>
            </div>
          ) : null}
          {result ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">
                Importadas: {result.imported}{" "}
                {result.errors.length > 0
                  ? ` · errores: ${result.errors.length}`
                  : null}
              </p>
              {result.errors.length > 0 ? (
                <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-destructive">
                  {result.errors.slice(0, 50).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);

  function handle(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-sm transition-colors ${
        dragging
          ? "border-primary bg-accent"
          : "border-border hover:border-primary/50"
      }`}
    >
      <Upload className="h-6 w-6 text-muted-foreground" />
      <span>Arrastrá un .json o hacé clic para elegir</span>
      <input
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </label>
  );
}
