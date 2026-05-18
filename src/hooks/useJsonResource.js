import { useEffect, useState } from 'react';

const cache = new Map();

export function useJsonResource(url) {
  const [state, setState] = useState(() => {
    const cached = cache.get(url);
    return cached ? { data: cached, loading: false, error: null } : { data: null, loading: true, error: null };
  });

  useEffect(() => {
    if (cache.has(url)) return;
    let cancelled = false;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
        return res.json();
      })
      .then(data => {
        cache.set(url, data);
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch(error => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });
    return () => { cancelled = true; };
  }, [url]);

  return state;
}
