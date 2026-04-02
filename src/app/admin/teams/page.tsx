import { Suspense } from "react";
import { AdminTeamsView } from "./AdminTeamsView";
import { Skeleton } from "@/components/ui/Skeleton";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function AdminTeamsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminTeamsView />
    </Suspense>
  );
}
