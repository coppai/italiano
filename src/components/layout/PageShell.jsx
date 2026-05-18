export default function PageShell({ variant = 'default', children }) {
  return (
    <div className={variant === 'index' ? 'index-page' : ''}>
      <div className="container">{children}</div>
    </div>
  );
}
