export default function DrillStats({ remaining, correct, incorrect }) {
  return (
    <div className="stats">
      <div className="stat-item">
        <div className="stat-value">{remaining}</div>
        <div className="stat-label">Remaining</div>
      </div>
      <div className="stat-item">
        <div className="stat-value" style={{ color: 'var(--success)' }}>{correct}</div>
        <div className="stat-label">Correct</div>
      </div>
      <div className="stat-item">
        <div className="stat-value" style={{ color: 'var(--error)' }}>{incorrect}</div>
        <div className="stat-label">Incorrect</div>
      </div>
    </div>
  );
}
