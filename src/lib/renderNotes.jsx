/**
 * Renders notes with table formatting support.
 * If notes contain pipe-delimited table data ("|"), renders as a mini table.
 * Otherwise, renders as regular text.
 */
export function renderNotes(notes) {
  if (!notes) return null;

  // Check if notes contain table data (has pipe delimiters)
  const lines = notes.trim().split('\n');
  const hasTableFormat = lines.length > 1 && lines[0].includes('|');

  if (hasTableFormat) {
    return (
      <table className="notes-table">
        <thead>
          <tr>
            {lines[0].split('|').map((header, i) => (
              <th key={i}>{header.trim()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.slice(1).map((line, rowIdx) => (
            <tr key={rowIdx}>
              {line.split('|').map((cell, cellIdx) => (
                <td key={cellIdx}>{cell.trim()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Regular text notes
  return <>{notes}</>;
}
