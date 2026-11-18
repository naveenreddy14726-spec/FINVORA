"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, type ApiResult } from "./api";

type Loaded<T> = { key: string; result: ApiResult<T> };

// Fetches `path` and exposes loading / error / data. Loading is derived (no state set
// synchronously in the effect): it is true while the stored result belongs to an older request.
export function useApi<T>(path: string) {
  const [nonce, setNonce] = useState(0);
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);
  const key = `${path}#${nonce}`;

  useEffect(() => {
    let cancelled = false;
    apiGet<T>(path).then((result) => {
      if (!cancelled) setLoaded({ key, result });
    });
    return () => {
      cancelled = true;
    };
  }, [path, key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const current = loaded && loaded.key === key ? loaded.result : null;
  return {
    loading: current === null,
    data: current && current.ok ? current.data : null,
    error: current && !current.ok ? current.message : null,
    reload,
  };
}
