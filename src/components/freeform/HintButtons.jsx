export default function HintButtons({ onShowGender, onShowMeaning, onShowAnswer, onPronounce }) {
  return (
    <div className="btn-group">
      {onShowGender ? <button className="btn-hint" onClick={onShowGender}>Show Gender</button> : null}
      {onShowMeaning ? <button className="btn-hint" onClick={onShowMeaning}>Show Meaning</button> : null}
      {onShowAnswer ? <button className="btn-hint" onClick={onShowAnswer}>Show Answer</button> : null}
      {onPronounce ? <button className="btn-hint" onClick={onPronounce}>🔊 Pronounce</button> : null}
    </div>
  );
}
