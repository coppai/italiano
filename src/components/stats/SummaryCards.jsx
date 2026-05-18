export default function SummaryCards({ cards }) {
  return (
    <div className="stats-summary">
      {cards.map(card => (
        <div className="summary-card" key={card.label}>
          <h3>{card.label}</h3>
          <div className={['value', card.className].filter(Boolean).join(' ')}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
