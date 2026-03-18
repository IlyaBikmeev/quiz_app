import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';

function defaultCard() {
  return { term: '', definition: '' };
}

export function CardSetCreateManualPage() {
  const [title, setTitle] = useState('');
  const [cards, setCards] = useState([defaultCard()]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const addCard = () => setCards((c) => [...c, defaultCard()]);
  const removeCard = (idx) => setCards((c) => c.filter((_, i) => i !== idx));

  const setCardTerm = (idx, term) => {
    setCards((c) => c.map((item, i) => (i === idx ? { ...item, term } : item)));
  };
  const setCardDefinition = (idx, definition) => {
    setCards((c) => c.map((item, i) => (i === idx ? { ...item, definition } : item)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      title: title || 'Без названия',
      cards: cards
        .map((c) => ({ term: c.term?.trim() ?? '', definition: c.definition?.trim() ?? '' }))
        .filter((c) => c.term || c.definition),
    };
    if (payload.cards.length === 0) {
      setError('Добавьте хотя бы одну карточку.');
      return;
    }
    try {
      const res = await apiJson('/api/v1/card-sets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      navigate(res?.id ? `/card-sets/${res.id}` : '/card-sets');
    } catch (err) {
      setError(err.message || 'Ошибка сохранения');
    }
  };

  return (
    <div>
      <h1 className="mb-4">Создать набор вручную</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Название набора</label>
          <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {cards.map((card, idx) => (
          <div key={idx} className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Карточка {idx + 1}</strong>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeCard(idx)}>Удалить</button>
              </div>
              <div className="mb-2">
                <label className="form-label small">Термин (лицевая сторона)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Термин"
                  value={card.term}
                  onChange={(e) => setCardTerm(idx, e.target.value)}
                />
              </div>
              <div>
                <label className="form-label small">Определение (обратная сторона)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Определение"
                  value={card.definition}
                  onChange={(e) => setCardDefinition(idx, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline-primary mb-3" onClick={addCard}>+ Карточка</button>
        {error && <div className="alert alert-danger">{error}</div>}
        <button type="submit" className="btn btn-primary me-2">Создать набор</button>
        <Link to="/card-sets/new" className="btn btn-secondary">Отмена</Link>
      </form>
      <p className="mt-3"><Link to="/card-sets">← К списку наборов</Link></p>
    </div>
  );
}
