import FlipDeckRunner from '../components/flip/FlipDeckRunner.jsx';
import BackButton from '../components/layout/BackButton.jsx';
import { POSSESSIVE_CARDS } from '../data/possessiveCards.js';

export default function PossessiveFlashcards() {
  return (
    <div className="flashcards-page">
      <div className="container">
        <div className="header">
          <h1>Possessive Chart Flashcards</h1>
          <p>Learn the possessive forms by owner and gender/number</p>
        </div>
      </div>
      <FlipDeckRunner
        cards={POSSESSIVE_CARDS}
        renderFront={card => (
          <>
            <div className="flashcard-label">What is the possessive form?</div>
            <div className="flashcard-content">
              <div style={{ fontSize: '1.8rem', marginBottom: 20 }}>{card.owner}</div>
              <div style={{ fontSize: '1.4rem', color: '#7f8c8d' }}>{card.type}</div>
            </div>
          </>
        )}
        renderBack={card => (
          <>
            <div className="flashcard-label">Answer</div>
            <div className="flashcard-content">{card.form}</div>
          </>
        )}
        getSpeechText={card => card.form}
        speechRate={0.7}
        showRateButtons
        backLink={
          <div style={{ marginTop: 20 }}>
            <BackButton to="/possessives">← Back to Possessives Practice</BackButton>
          </div>
        }
      />
    </div>
  );
}
