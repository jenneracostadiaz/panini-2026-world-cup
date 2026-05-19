import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-8 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </section>
      <section>
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-1 h-3 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-2 h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
