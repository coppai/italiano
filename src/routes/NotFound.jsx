import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="index-page">
      <div className="container">
        <div className="header">
          <h1>Page not found</h1>
        </div>
        <div className="back-link">
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
