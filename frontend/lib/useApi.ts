"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResult } from "./api";

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
  fromMock: boolean;
  reload: () => void;
}

/**
 * Runs an async ApiResult-returning function and exposes loading/error/mock
 * flags. `deps` re-triggers the fetch. The API layer already falls back to mock
 * data, so `error` is reserved for truly unexpected failures.
 */
export function useApi<T>(
  fn: () => Promise<ApiResult<T>>,
  deps: unknown[],
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fromMock, setFromMock] = useState(false);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fn()
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setFromMock(res.fromMock);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, fromMock, reload };
}
