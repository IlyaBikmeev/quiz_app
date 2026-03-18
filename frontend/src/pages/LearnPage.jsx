import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiJson } from '../api/client';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(str) {
  return (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function LearnPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState('card'); // card | choice | written
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [writtenInput, setWrittenInput] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    apiJson(`/api/v1/card-sets/${id}/learn/start`, { method: 'POST' })
      .then((data) => {
        if (!cancelled) {
          setSession(data);
          setCurrentCard(data.currentCard);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Ошибка загрузки');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  const getMcOptions = () => {
    if (!session?.cards || !currentCard) return [];
    const correctDef = currentCard.definition;
    const others = session.cards.filter((c) => c.id !== currentCard.id && c.definition !== correctDef);
    const wrongDefs = [...new Set(shuffle(others).map((c) => c.definition))].slice(0, 3);
    const wrong = wrongDefs.map((text) => ({ text, correct: false }));
    const options = [...wrong, { text: correctDef, correct: true }];
    return shuffle(options);
  };

  const [mcOptions, setMcOptions] = useState([]);
  useEffect(() => {
    if (mode === 'choice' && currentCard) setMcOptions(getMcOptions());
  }, [mode, currentCard?.id]);

  const submitAnswer = async (correct) => {
    if (!session || !currentCard || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiJson(`/api/v1/learn/sessions/${session.sessionId}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          cardId: currentCard.id,
          correct,
          answerType: mode === 'card' ? 'FLASHCARD' : mode === 'choice' ? 'MULTIPLE_CHOICE' : 'WRITTEN',
          direction: 'TERM_TO_DEF',
        }),
      });
      setCorrectCount((c) => c + (correct ? 1 : 0));
      setTotalAnswered((t) => t + 1);
      if (res.sessionComplete) {
        setFinished(true);
        setCurrentCard(null);
      } else {
        setCurrentCard(res.nextCard);
        setFlipped(false);
        setWrittenInput('');
        setSelectedOption(null);
        setShowResult(false);
      }
    } catch (err) {
      setError(err.message || 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKnow = () => submitAnswer(true);
  const handleDontKnow = () => submitAnswer(false);

  const handleMcSelect = (opt) => {
    if (showResult) return;
    setSelectedOption(opt);
    const correct = opt.correct;
    setLastCorrect(correct);
    setShowResult(true);
  };

  const handleMcNext = () => submitAnswer(lastCorrect);

  const handleWrittenCheck = () => {
    if (showResult) {
      submitAnswer(lastCorrect);
      return;
    }
    const correct = normalize(writtenInput) === normalize(currentCard?.definition);
    setLastCorrect(correct);
    setShowResult(true);
  };

  const handleWrittenNext = () => submitAnswer(lastCorrect);

  const handleCompleteEarly = async () => {
    if (!session?.sessionId || submitting) return;
    setSubmitting(true);
    try {
      await apiJson(`/api/v1/learn/sessions/${session.sessionId}/complete`, { method: 'POST' });
      setFinished(true);
      setCurrentCard(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center">Загрузка…</div>;
  if (error && !session) return <div className="alert alert-danger">{error}<br /><Link to={`/card-sets/${id}`}>← К набору</Link></div>;
  if (!session) return null;

  if (finished) {
    const total = session.cards?.length ?? 0;
    const percent = total ? Math.round((correctCount / totalAnswered) * 100) : 0;
    return (
      <div>
        <h2>Сессия завершена</h2>
        <p>Правильно: {correctCount} из {totalAnswered} ({percent}%)</p>
        <Link to={`/card-sets/${id}`} className="btn btn-primary">К набору</Link>
        <Link to="/card-sets" className="btn btn-outline-secondary ms-2">К списку наборов</Link>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div>
        <p className="text-muted">Нет карточек для повторения.</p>
        <Link to={`/card-sets/${id}`} className="btn btn-primary">К набору</Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="mb-3 d-flex justify-content-between align-items-center">
        <Link to={`/card-sets/${id}`}>← К набору</Link>
        <div className="btn-group btn-group-sm">
          <button type="button" className={`btn btn-outline-secondary ${mode === 'card' ? 'active' : ''}`} onClick={() => { setMode('card'); setShowResult(false); setFlipped(false); }}>Карточки</button>
          <button type="button" className={`btn btn-outline-secondary ${mode === 'choice' ? 'active' : ''}`} onClick={() => { setMode('choice'); setMcOptions(getMcOptions()); setShowResult(false); }}>Выбор</button>
          <button type="button" className={`btn btn-outline-secondary ${mode === 'written' ? 'active' : ''}`} onClick={() => { setMode('written'); setShowResult(false); setWrittenInput(''); }}>Ввод</button>
        </div>
      </nav>

      <div className="mb-3 text-muted small">
        Отвечено: {totalAnswered} · Правильно: {correctCount}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {mode === 'card' && (
        <div className="card mb-4">
          <div className="card-body text-center py-5">
            <h4 className="mb-4">{flipped ? currentCard.definition : currentCard.term}</h4>
            {!flipped ? (
              <button type="button" className="btn btn-outline-primary" onClick={() => setFlipped(true)}>Показать ответ</button>
            ) : (
              <div className="d-flex gap-2 justify-content-center">
                <button type="button" className="btn btn-success" onClick={handleKnow} disabled={submitting}>Знаю</button>
                <button type="button" className="btn btn-danger" onClick={handleDontKnow} disabled={submitting}>Не знаю</button>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'choice' && (
        <div className="card mb-4">
          <div className="card-body">
            <h4 className="mb-4">{currentCard.term}</h4>
            <p className="text-muted small mb-3">Выберите правильное определение:</p>
            <div className="d-flex flex-column gap-2">
              {mcOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`btn text-start ${showResult ? (opt.correct ? 'btn-success' : selectedOption === opt ? 'btn-danger' : 'btn-outline-secondary') : 'btn-outline-primary'}`}
                  onClick={() => handleMcSelect(opt)}
                  disabled={submitting}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {showResult && (
              <button type="button" className="btn btn-primary mt-3" onClick={handleMcNext} disabled={submitting}>Далее</button>
            )}
          </div>
        </div>
      )}

      {mode === 'written' && (
        <div className="card mb-4">
          <div className="card-body">
            <h4 className="mb-4">{currentCard.term}</h4>
            <p className="text-muted small mb-2">Введите определение:</p>
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Введите ответ..."
              value={writtenInput}
              onChange={(e) => setWrittenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWrittenCheck()}
              disabled={submitting}
            />
            {showResult && (
              <div className={`alert ${lastCorrect ? 'alert-success' : 'alert-danger'} mb-3`}>
                {lastCorrect ? 'Верно!' : `Правильно: ${currentCard.definition}`}
              </div>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleWrittenCheck}
              disabled={submitting || !writtenInput.trim()}
            >
              {showResult ? 'Далее' : 'Проверить'}
            </button>
          </div>
        </div>
      )}

      <button type="button" className="btn btn-link text-muted" onClick={handleCompleteEarly} disabled={submitting}>Завершить досрочно</button>
    </div>
  );
}
