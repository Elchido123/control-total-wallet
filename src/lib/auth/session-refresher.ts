"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

const REFRESH_INTERVAL_MS = 4 * 60 * 1000;
const MAX_SESSION_MS = 12 * 60 * 60 * 1000;
const REFRESH_THRESHOLD = 10;

export function useSessionRefresher() {
  const { data: session, update } = useSession();
  const refreshCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      refreshCount.current++;

      const elapsed = Date.now() - startTime.current;
      if (elapsed > MAX_SESSION_MS || refreshCount.current > REFRESH_THRESHOLD) {
        return;
      }

      try {
        await update();
      } catch {
        window.location.href = "/login";
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [session, update]);
}
