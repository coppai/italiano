export default function FeedbackBanner({ status, message }) {
  if (!status) return <div id="feedback" />;
  const color = status === 'correct' ? 'var(--success)' : 'var(--error)';
  return <div id="feedback" style={{ color }}>{message}</div>;
}
