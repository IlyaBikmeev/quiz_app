import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../api/client';

export function QuizzesPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiJson(`/api/v1/quizzes?page=${page}&size=${size}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
  }, [page, size]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="text-center">Загрузка...</div>;

  const { content, totalPages, totalElements } = data;

  return (
    <div>
      <h1 className="mb-4">Квизы</h1>
      <div className="mb-3">
        <Link to="/quizzes/new" className="btn btn-primary">Создать квиз</Link>
      </div>
      <div className="list-group">
        {content && content.length === 0 && <p className="text-muted">Пока нет квизов.</p>}
        {content && content.map((quiz) => (
          <div key={quiz.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">{quiz.title}</h5>
              <small className="text-muted">Автор: {quiz.creatorName}</small>
            </div>
            <Link to={`/quizzes/${quiz.id}`} className="btn btn-outline-primary btn-sm">Подробнее</Link>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <nav className="mt-3">
          <ul className="pagination">
            <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
              <button type="button" className="page-link" onClick={() => setPage((p) => Math.max(0, p - 1))}>Назад</button>
            </li>
            <li className="page-item disabled"><span className="page-link">{page + 1} / {totalPages}</span></li>
            <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
              <button type="button" className="page-link" onClick={() => setPage((p) => p + 1)}>Вперёд</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
