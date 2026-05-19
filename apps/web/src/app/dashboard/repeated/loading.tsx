import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RepeatedLoading() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between">
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <Skeleton className="h-7 w-20" />
      </header>
      {Array.from({ length: 2 }).map((_, s) => (
        <section key={s} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-10" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="mt-1 h-3 w-12" />
                    </div>
                    <Skeleton className="h-5 w-8" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-full" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
