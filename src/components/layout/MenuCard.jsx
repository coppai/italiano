import { Link } from 'react-router-dom';

function isExternal(to) {
  return /^(https?:|\/legacy\/)/.test(to);
}

export default function MenuCard({ to, title, description, stats = [] }) {
  const content = (
    <>
      <h2>{title}</h2>
      <p>{description}</p>
      {stats.length > 0 ? (
        <div className="stats">
          {stats.map((s, i) => (
            <div className="stat" key={i}>
              {s.label ? <strong>{s.label}</strong> : null}
              {s.label && s.value ? ' ' : null}
              {s.value}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );

  if (isExternal(to)) {
    return (
      <a href={to} className="drill-card">
        {content}
      </a>
    );
  }

  return (
    <Link to={to} className="drill-card">
      {content}
    </Link>
  );
}
