import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiJson } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function VerifyPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiJson('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      if (data.token) {
        setToken(data.token);
        navigate('/quizzes', { replace: true });
      } else {
        setError(data.message || 'Неверный код');
      }
    } catch (err) {
      setError(err.message || 'Неверный код или срок действия истёк');
    }
  };

  if (!email) return null;

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <div className="card shadow">
          <div className="card-body p-4">
            <h2 className="text-center mb-4">Введите код</h2>
            <p className="text-muted text-center">Код отправлен на {email}</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Код из письма</label>
                <input
                  type="text"
                  className="form-control text-center"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <button type="submit" className="btn btn-primary w-100">Подтвердить</button>
            </form>
            <p className="mt-3 text-center">
              <Link to="/login">Запросить новый код</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
