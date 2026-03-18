import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../api/client';

export function CardSetImportPage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Выберите файл');
      return;
    }
    setError('');
    setLoading(true);
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/card-sets/import`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}`, 'X-Requested-With': 'XMLHttpRequest' } : {},
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      navigate(data?.id ? `/card-sets/${data.id}` : '/card-sets');
    } catch (err) {
      setError(err.message || 'Ошибка импорта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4">Импорт набора из файла</h1>

      <div className="card bg-light mb-4">
        <div className="card-body">
          <h5 className="card-title">Формат файла</h5>
          <p className="mb-2">Текстовый файл UTF-8. Одна карточка на строку: <strong>термин</strong> и <strong>определение</strong> разделены табуляцией.</p>
          <p className="mb-2"><strong>Пример:</strong></p>
          <pre className="bg-white border rounded p-3 small mb-0" style={{ whiteSpace: 'pre-wrap' }}>{`жаропонижающий	antipyretic
осветление	lightening
утомление	fatigue/ tiredness`}</pre>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Файл (.txt или .md)</label>
          <input
            ref={inputRef}
            type="file"
            className="form-control"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={handleFileChange}
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button type="submit" className="btn btn-primary me-2" disabled={loading}>{loading ? 'Загрузка...' : 'Импортировать'}</button>
        <Link to="/card-sets/new" className="btn btn-secondary">Отмена</Link>
      </form>
      <p className="mt-3"><Link to="/card-sets">← К списку наборов</Link></p>
    </div>
  );
}
