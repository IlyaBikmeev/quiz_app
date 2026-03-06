import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiJson, apiFetch } from '../api/client';

export function QuizDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiJson(`/api/v1/quizzes/${id}`)
      .then((res) => { if (!cancelled) setQuiz(res); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [id]);

  const startQuiz = async () => {
    try {
      const attempt = await apiJson(`/api/v1/quizzes/${id}/attempts`);
      navigate(`/quizzes/${id}/play`, { state: { attempt } });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить этот квиз? Это действие нельзя отменить.')) return;
    try {
      const res = await apiFetch(`/api/v1/quizzes/${id}`, { method: 'DELETE' });
      if (res.ok) navigate('/quizzes');
      else setError('Не удалось удалить квиз');
    } catch (err) {
      setError(err.message || 'Не удалось удалить квиз');
    }
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!quiz) return <div className="text-center">Загрузка...</div>;

  return (
    <div>
      <nav className="mb-3"><Link to="/quizzes">← К списку квизов</Link></nav>
      <h1>{quiz.title}</h1>
      <p className="text-muted">Автор: {quiz.creatorName}</p>
      {quiz.questions && quiz.questions.length > 0 && (
        <div className="mb-4">
          <h5>Вопросы ({quiz.questions.length})</h5>
          <ul className="list-group">
            {quiz.questions.map((q, i) => (
              <li key={q.id} className="list-group-item">{i + 1}. {q.text}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <button type="button" className="btn btn-primary" onClick={startQuiz}>Начать прохождение</button>
        {quiz.canEdit && (
          <>
            <Link to={`/quizzes/${quiz.id}/edit`} className="btn btn-outline-secondary">Редактировать</Link>
            <button type="button" className="btn btn-outline-danger" onClick={handleDelete}>Удалить</button>
          </>
        )}
      </div>
    </div>
  );
}
