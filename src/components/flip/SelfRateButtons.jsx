export default function SelfRateButtons({ onCorrect, onIncorrect, labels = {} }) {
  return (
    <div className="card-answer-buttons">
      <button className="btn-incorrect" onClick={e => { e.stopPropagation(); onIncorrect?.(); }}>
        {labels.incorrect || '✗ Need Practice'}
      </button>
      <button className="btn-correct" onClick={e => { e.stopPropagation(); onCorrect?.(); }}>
        {labels.correct || '✓ Got It!'}
      </button>
    </div>
  );
}
