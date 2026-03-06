import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../api/client';

export function SettingsPage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson('/api/v1/users/me')
      .then((data) => {
        setUser(data);
        setName(data.name || '');
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setMessage('Функционал изменения настроек будет доступен в будущих обновлениях');
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!user) return <div className="text-center">Загрузка...</div>;

  return (
    <div>
      <h1 className="mb-4">Настройки профиля</h1>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={user.email} readOnly />
              <div className="form-text">Email нельзя изменить</div>
            </div>
            <div className="mb-3">
              <label className="form-label">Никнейм</label>
              <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="form-text">Никнейм должен быть уникальным</div>
            </div>
            {message && <div className="alert alert-info">{message}</div>}
            <button type="submit" className="btn btn-primary me-2">Сохранить изменения</button>
            <Link to="/profile" className="btn btn-secondary">Отмена</Link>
          </form>
        </div>
      </div>
    </div>
  );
}
