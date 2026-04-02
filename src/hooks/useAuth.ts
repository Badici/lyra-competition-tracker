"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser } from "@/types/models";

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const { data } = await axios.get<AuthUser | null>("/api/auth/me", {
      withCredentials: true,
    });
    return data;
  } catch {
    return null;
  }
}

export function useAuth() {
  const { user, setUser, setHydrated } = useAuthStore();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (q.isFetched) {
      setUser(q.data ?? null);
      setHydrated(true);
    }
  }, [q.isFetched, q.data, setUser, setHydrated]);

  const logout = async () => {
    await axios.post("/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
    await qc.invalidateQueries({ queryKey: queryKeys.me });
  };

  const resolvedUser = q.data !== undefined ? q.data : user;

  return {
    user: resolvedUser,
    /** După primul răspuns /me — folosit pentru RBAC și nav (inclusiv Portal admin). */
    hydrated: q.isFetched,
    isLoading: q.isLoading,
    refetch: q.refetch,
    logout,
  };
}
