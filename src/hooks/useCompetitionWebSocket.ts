"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Optional WebSocket: set NEXT_PUBLIC_WS_URL (e.g. wss://host/ws).
 * Subscribes to `competition/{id}/` channel if server supports it.
 * On any message, invalidates competition queries (polling remains backup).
 */
export function useCompetitionWebSocket(competitionId: string | undefined) {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "");
    if (!base || !competitionId) return;

    const url = `${base}/competition/${competitionId}/`;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = () => {
        void qc.invalidateQueries({
          queryKey: queryKeys.competition(competitionId),
        });
        void qc.invalidateQueries({ queryKey: queryKeys.teams(competitionId) });
        void qc.invalidateQueries({
          queryKey: queryKeys.sectors(competitionId),
        });
        void qc.invalidateQueries({
          queryKey: queryKeys.weighIns(competitionId),
        });
        void qc.invalidateQueries({
          queryKey: queryKeys.results(competitionId),
        });
        void qc.invalidateQueries({
          queryKey: queryKeys.stands(competitionId),
        });
      };
      ws.onerror = () => {
        ws.close();
      };
    } catch {
      /* fallback: polling only */
    }

    return () => {
      closed = true;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [competitionId, qc]);
}
