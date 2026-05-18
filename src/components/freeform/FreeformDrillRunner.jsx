import { useEffect, useMemo, useRef, useState } from 'react';
import DrillStats from './DrillStats.jsx';
import AnswerInput from './AnswerInput.jsx';
import FeedbackBanner from './FeedbackBanner.jsx';
import HintButtons from './HintButtons.jsx';
import CompletedSidebar from './CompletedSidebar.jsx';
import { shuffle } from '../../lib/shuffle.js';
import { speakItalian } from '../../lib/speak.js';
import { DECK_SIZE } from '../../lib/constants.js';
import { useLocalStorageStats } from '../../hooks/useLocalStorageStats.js';

// Shared engine for the article / partitive / plural-endings drills.
// `config` describes how to extract prompts, validate answers, render hints,
// and (optionally) persist stats.
export default function FreeformDrillRunner({ config, items, backLink }) {
  const {
    getPrompt,
    promptRender,
    getCorrectVariants,
    normalize,
    getSpeechText,
    renderExtraInfo,
    statsConfig,
    sidebar,
    submitDelayMs = 0,
    onIncorrectExtra,
    inputPlaceholder,
    inputStyle,
  } = config;

  const inputRef = useRef(null);

  const deck = useMemo(() => {
    const slice = shuffle(items).slice(0, DECK_SIZE);
    return shuffle(slice);
  }, [items]);

  const [remaining, setRemaining] = useState(deck);
  const [completed, setCompleted] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState({ status: null, message: '' });
  const [extraInfo, setExtraInfo] = useState(null);
  const [pendingAdvance, setPendingAdvance] = useState(false);

  const stats = useLocalStorageStats(statsConfig?.storageKey || '__noop__');
  const current = remaining[0];

  useEffect(() => {
    if (current && !pendingAdvance) inputRef.current?.focus();
  }, [current, pendingAdvance]);

  function submit() {
    if (!current || pendingAdvance) return;
    const normalizedInput = normalize(input);
    const variants = getCorrectVariants(current).map(normalize);
    const isCorrect = variants.includes(normalizedInput);

    if (statsConfig) {
      stats.record(statsConfig.keyFor(current), statsConfig.seed(current), isCorrect);
    }

    if (isCorrect) {
      setFeedback({ status: 'correct', message: 'Bravo! Correct.' });
      setCorrectCount(c => c + 1);
      setCompleted(prev => [...prev, current]);
      if (getSpeechText) speakItalian(getSpeechText(current));

      if (submitDelayMs > 0) {
        setPendingAdvance(true);
        setTimeout(() => {
          setRemaining(prev => prev.slice(1));
          setInput('');
          setFeedback({ status: null, message: '' });
          setExtraInfo(null);
          setPendingAdvance(false);
        }, submitDelayMs);
      } else {
        setRemaining(prev => prev.slice(1));
        setInput('');
        // Keep extraInfo visible briefly then clear (matches legacy 3s timeout)
        if (extraInfo) {
          setTimeout(() => setExtraInfo(null), 3000);
        }
      }
    } else {
      setFeedback({ status: 'incorrect', message: 'Try again!' });
      setIncorrectCount(c => c + 1);
      if (onIncorrectExtra) {
        setExtraInfo(onIncorrectExtra(current));
      }
    }
  }

  const isGameOver = remaining.length === 0;

  return (
    <div className="container">
      <div className="main-content">
        <div className="card">
          {backLink}

          <DrillStats remaining={remaining.length} correct={correctCount} incorrect={incorrectCount} />

          {isGameOver ? (
            <>
              <div className="word"><div className="game-over">🎉 Game Over! 🎉</div></div>
              <div className="info-area">
                <div className="info-text">You completed all {correctCount} words!</div>
              </div>
            </>
          ) : (
            <>
              {promptRender ? promptRender(current) : (
                <div id="display-word" className="word">{getPrompt(current)}</div>
              )}

              <AnswerInput
                ref={inputRef}
                value={input}
                onChange={setInput}
                onSubmit={submit}
                placeholder={inputPlaceholder}
                style={inputStyle}
              />
              <br />
              <button className="btn-submit" onClick={submit}>Submit</button>

              <FeedbackBanner status={feedback.status} message={feedback.message} />

              <hr />

              <div className="info-area">
                <div className="info-text">{extraInfo}</div>
              </div>

              <HintButtons
                onShowGender={renderExtraInfo?.gender ? () => setExtraInfo(renderExtraInfo.gender(current)) : null}
                onShowMeaning={renderExtraInfo?.meaning ? () => setExtraInfo(renderExtraInfo.meaning(current)) : null}
                onShowAnswer={renderExtraInfo?.answer ? () => setExtraInfo(renderExtraInfo.answer(current)) : null}
                onPronounce={getSpeechText ? () => speakItalian(getSpeechText(current)) : null}
              />
            </>
          )}
        </div>
      </div>

      {sidebar ? (
        <CompletedSidebar
          items={completed}
          getLabel={sidebar.getLabel}
          getSpeech={sidebar.getSpeech}
        />
      ) : null}
    </div>
  );
}
