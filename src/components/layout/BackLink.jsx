import { Link } from 'react-router-dom';

export default function BackLink({ to = '/', children = '← Back to Home' }) {
  return (
    <div className="back-link">
      <Link to={to}>{children}</Link>
    </div>
  );
}
