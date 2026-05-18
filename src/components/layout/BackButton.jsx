import { useNavigate } from 'react-router-dom';

export default function BackButton({ to = '/', children = '← Back', className = 'btn-back' }) {
  const navigate = useNavigate();
  return (
    <button type="button" className={className} onClick={() => navigate(to)}>
      {children}
    </button>
  );
}
