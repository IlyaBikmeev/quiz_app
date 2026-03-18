import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';

export function CardSetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cardSet, setCardSet] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiJson(`/api/v1/card-sets/${id}`)
      .then((res) => { if (!cancelled) setCardSet(res); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [id]);

  const startLearn = () => {
    navigate(`/card-sets/${id}/learn`);
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!cardSet) return <div className="text-center">Загрузка...</div>;

  const cards = cardSet.flashcards || [];

  return (
    <div>
      <nav className="mb-3"><Link to="/card-sets">← К списку наборов</Link></nav>
      <h1>{cardSet.title}</h1>
      <p className="text-muted">Автор: {cardSet.creatorName}</p>
      {cards.length > 0 ? (
        <div className="mb-4">
          <h5>Карточки ({cards.length})</h5>
          <ul className="list-group">
            {cards.map((c, i) => (
              <li key={c.id} className="list-group-item">
                <strong>{c.term}</strong> — {c.definition}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-muted mb-4">В наборе пока нет карточек.</p>
      )}
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <button
          type="button"
          className="btn btn-primary"
          onClick={startLearn}
          disabled={cards.length === 0}
        >
          Заучивание
        </button>
      </div>
    </div>
  );
}
