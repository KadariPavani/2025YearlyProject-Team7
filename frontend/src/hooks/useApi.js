import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';

// Generic API hook to standardize loading/error/state handling and cancellation
export default function useApi(initialConfig = {}) {
  const { autoCancel = true, onError } = initialConfig;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  // Cancel in-flight request
  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  const request = useCallback(async (configOrFn, ...args) => {
    try {
      setLoading(true);
      setError(null);

      if (autoCancel) cancel();
      abortRef.current = new AbortController();

      // Support passing either a config object for api(...) or a function that calls api
      const exec = typeof configOrFn === 'function'
        ? configOrFn
        : () => api({ ...configOrFn, signal: abortRef.current.signal });

      const response = await exec(...args);
      const payload = response?.data ?? response;
      setData(payload);
      return payload;
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.message === 'canceled') {
        return; // silent on cancel
      }
      setError(err);
      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [autoCancel, cancel, onError]);

  const state = useMemo(() => ({ data, error, loading }), [data, error, loading]);

  return { ...state, request, cancel, setData, setError };
}


