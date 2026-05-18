export default function StatsTable({ columns, rows, sortKey, ascending, onSort }) {
  return (
    <div className="stats-table-container">
      <table className="stats-table">
        <thead>
          <tr>
            {columns.map(col => {
              const sortClass = col.key === sortKey ? (ascending ? 'sorted-asc' : 'sorted-desc') : '';
              return (
                <th key={col.key} className={sortClass} onClick={() => onSort(col.key)}>
                  {col.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.key || idx}>
              {columns.map(col => (
                <td key={col.key} className={col.cellClass ? col.cellClass(row) : ''}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
