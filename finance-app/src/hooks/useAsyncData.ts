import { useCallback, useEffect, useState } from 'react';
import { toErrorCode } from '../lib/errors';
import type { MarketErrorCode } from '../types/market';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: MarketErrorCode };

type Settled<T> = { ok: true; data: T } | { ok: false; error: MarketErrorCode };

/**
 * Minimal request hook (loading / success / error / retry) with abort on change or unmount.
 * `load` must be stable (wrap in useCallback): a new function identity starts a new request.
 * Status is derived, not set synchronously in an effect, so there is no stale-data flash
 * when the inputs change.
 */
export function useAsyncData<T>(
  requestId: string,
  load: (signal: AbortSignal) => Promise<T>,
): AsyncState<T> & { reload: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{ key: string; result: Settled<T> } | null>(null);
  const key = `${requestId}#${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ key, result: { ok: true, data } });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setSettled({ key, result: { ok: false, error: toErrorCode(error) } });
      },
    );
    return () => controller.abort();
  }, [key, load]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  if (!settled || settled.key !== key) return { status: 'loading', reload };
  if (settled.result.ok) return { status: 'success', data: settled.result.data, reload };
  return { status: 'error', error: settled.result.error, reload };
}
