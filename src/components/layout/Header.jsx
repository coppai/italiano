export default function Header({ title, subtitle }) {
  return (
    <div className="header">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}
