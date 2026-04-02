"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isPrivilegedUser } from "@/lib/auth/rbac";
import { Skeleton } from "@/components/ui/Skeleton";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login?next=/admin/contests");
      return;
    }
    if (!isPrivilegedUser(user)) {
      router.replace("/dashboard");
    }
  }, [user, hydrated, router]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-lg space-y-3 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!user || !isPrivilegedUser(user)) {
    return null;
  }

  return <>{children}</>;
}
