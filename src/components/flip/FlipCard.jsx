// Presentational flip-card. Front/back are arbitrary nodes; consumer controls
// flipped state to keep the component composable across drills.
export default function FlipCard({ front, back, flipped, onClick }) {
  return (
    <div className="flashcard-container">
      <div
        className={['flashcard', flipped ? 'flipped' : ''].filter(Boolean).join(' ')}
        onClick={onClick}
      >
        <div className="flashcard-face flashcard-front">{front}</div>
        <div className="flashcard-face flashcard-back">{back}</div>
      </div>
    </div>
  );
}
