import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Página no encontrada</CardTitle>
          <CardDescription>
            La sección que buscás no existe o fue movida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Volver al dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
