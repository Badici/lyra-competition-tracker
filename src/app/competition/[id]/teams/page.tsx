import { Suspense } from "react";
import { TeamsView } from "./TeamsView";
import { Skeleton } from "@/components/ui/Skeleton";

function Fallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <TeamsView />
    </Suspense>
  );
}
