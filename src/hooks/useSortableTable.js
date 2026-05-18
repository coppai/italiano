import { useMemo, useState } from 'react';
import { compareValues } from '../lib/compare.js';

export function useSortableTable(rows, defaults = {}) {
  const [sortKey, setSortKey] = useState(defaults.key || null);
  const [ascending, setAscending] = useState(defaults.ascending ?? false);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => compareValues(a[sortKey], b[sortKey], ascending));
  }, [rows, sortKey, ascending]);

  function toggle(key) {
    if (sortKey === key) {
      setAscending(prev => !prev);
    } else {
      setSortKey(key);
      setAscending(true);
    }
  }

  return { sortedRows: sorted, sortKey, ascending, toggle };
}
