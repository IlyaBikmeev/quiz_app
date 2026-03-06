import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../api/client';

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson('/api/v1/users/me')
      .then(setUser)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!user) return <div className="text-center">Загрузка...</div>;

  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

  return (
    <div>
      <h1 className="mb-4">Профиль</h1>
      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>{initial}</div>
            <div>
              <h5 className="mb-0">{user.name || '—'}</h5>
              <p className="text-muted mb-0">{user.email}</p>
            </div>
          </div>
          <Link to="/settings" className="btn btn-outline-primary">Настройки</Link>
        </div>
      </div>
    </div>
  );
}
