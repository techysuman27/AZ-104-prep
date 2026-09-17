import { useEffect, useState } from 'react';

export type AsyncState<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: Error };

/** Runs an async loader whenever `key` changes; ignores stale results. */
export function useAsync<T>(key: string, load: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<{ key: string; value: AsyncState<T> }>({ key, value: { status: 'loading' } });

  useEffect(() => {
    let alive = true;
    load().then(
      (data) => alive && setState({ key, value: { status: 'ready', data } }),
      (error: unknown) =>
        alive && setState({ key, value: { status: 'error', error: error instanceof Error ? error : new Error(String(error)) } }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state.key === key ? state.value : { status: 'loading' };
}
