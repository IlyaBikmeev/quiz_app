import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../api/client';

export function QuizImportPage() {
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
      const res = await fetch(`${getApiUrl()}/api/v1/quizzes/import`, {
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
      navigate(data?.id ? `/quizzes/${data.id}` : '/quizzes');
    } catch (err) {
      setError(err.message || 'Ошибка импорта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4">Импорт квиза из файла</h1>
      <p className="text-muted">Формат: блоки Question: / Options: / [*] и [ ] для правильных и неправильных вариантов. Подробнее — в IMPORT_QUIZ_FORMAT.md.</p>
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
        <Link to="/quizzes/new" className="btn btn-secondary">Отмена</Link>
      </form>
      <p className="mt-3"><Link to="/quizzes">← К списку квизов</Link></p>
    </div>
  );
}
