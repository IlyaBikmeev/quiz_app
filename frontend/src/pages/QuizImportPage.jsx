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

      <div className="card bg-light mb-4">
        <div className="card-body">
          <h5 className="card-title">Формат файла</h5>
          <p className="mb-2">Нужен <strong>текстовый</strong> файл в кодировке UTF-8 (например <code>.txt</code> или <code>.md</code>). PDF и другие бинарные форматы не подходят.</p>
          <p className="mb-2">В файле подряд идут блоки вопросов. Каждый блок устроен так:</p>
          <ul className="mb-2">
            <li><code>Question:</code> — с новой строки пишете текст вопроса (можно в несколько строк).</li>
            <li><code>Options:</code> — с новой строки перечисляете варианты ответа.</li>
            <li>Перед вариантом: <code>[*]</code> — правильный ответ, <code>[ ]</code> (пробел в скобках) — неправильный.</li>
            <li>Правильных ответов может быть несколько — тогда несколько строк с <code>[*]</code>.</li>
          </ul>
          <p className="mb-2 small text-muted">Пустая строка между блоками не обязательна, но допустима.</p>
          <p className="mb-1"><strong>Пример блока:</strong></p>
          <pre className="bg-white border rounded p-3 small mb-0" style={{ whiteSpace: 'pre-wrap' }}>{`Question: Столица России?
Options:
[*] Москва
[ ] Санкт-Петербург
[ ] Казань
[ ] Новосибирск`}</pre>
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
        <Link to="/quizzes/new" className="btn btn-secondary">Отмена</Link>
      </form>
      <p className="mt-3"><Link to="/quizzes">← К списку квизов</Link></p>
    </div>
  );
}
