import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';

function questionToState(q) {
  return {
    text: q.text || '',
    options: Array.isArray(q.options) && q.options.length > 0 ? [...q.options] : [''],
    correctAnswers: Array.isArray(q.correctAnswers) ? [...q.correctAnswers] : [],
  };
}

function defaultQuestion() {
  return { text: '', options: [''], correctAnswers: [] };
}

export function QuizEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiJson(`/api/v1/quizzes/${id}`)
      .then((data) => {
        if (cancelled) return;
        setTitle(data.title || '');
        setQuestions(
          data.questions && data.questions.length > 0
            ? data.questions.map(questionToState)
            : [defaultQuestion()]
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Не удалось загрузить квиз');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const addQuestion = () => setQuestions((q) => [...q, defaultQuestion()]);
  const removeQuestion = (idx) => setQuestions((q) => q.filter((_, i) => i !== idx));

  const setQuestionText = (idx, text) => {
    setQuestions((q) => q.map((item, i) => (i === idx ? { ...item, text } : item)));
  };
  const addOption = (qIdx) => {
    setQuestions((q) => q.map((item, i) =>
      i === qIdx ? { ...item, options: [...(item.options || []), ''] } : item
    ));
  };
  const setOption = (qIdx, oIdx, value) => {
    setQuestions((q) => q.map((item, i) =>
      i === qIdx ? { ...item, options: (item.options || []).map((o, j) => (j === oIdx ? value : o)) } : item
    ));
  };
  const removeOption = (qIdx, oIdx) => {
    setQuestions((q) => q.map((item, i) =>
      i === qIdx ? { ...item, options: (item.options || []).filter((_, j) => j !== oIdx) } : item
    ));
  };
  const toggleCorrect = (qIdx, oIdx) => {
    setQuestions((q) => q.map((item, i) => {
      if (i !== qIdx) return item;
      const set = new Set(item.correctAnswers || []);
      if (set.has(oIdx)) set.delete(oIdx);
      else set.add(oIdx);
      return { ...item, correctAnswers: Array.from(set) };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      title: title || 'Без названия',
      description: null,
      questions: questions.map((q) => ({
        text: q.text,
        options: (q.options || []).filter(Boolean),
        correctAnswers: (q.correctAnswers || []).sort((a, b) => a - b),
      })).filter((q) => q.text.trim()),
    };
    if (payload.questions.length === 0) {
      setError('Должен остаться хотя бы один вопрос с текстом и вариантами.');
      return;
    }
    try {
      await apiJson(`/api/v1/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      navigate(`/quizzes/${id}`);
    } catch (err) {
      setError(err.message || 'Ошибка сохранения');
    }
  };

  if (loading) return <div className="text-center">Загрузка...</div>;
  if (error && !title && questions.length === 0) return <div className="alert alert-danger">{error}. <Link to={`/quizzes/${id}`}>Вернуться к квизу</Link></div>;

  return (
    <div>
      <h1 className="mb-4">Редактировать квиз</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Название квиза</label>
          <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Вопрос {qIdx + 1}</strong>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeQuestion(qIdx)}>Удалить</button>
              </div>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Текст вопроса"
                value={q.text}
                onChange={(e) => setQuestionText(qIdx, e.target.value)}
              />
              <label className="form-label small">Варианты (отметьте правильные)</label>
              {(q.options && q.options.length > 0 ? q.options : ['']).map((opt, oIdx) => (
                <div key={oIdx} className="input-group mb-1">
                  <div className="input-group-text">
                    <input
                      type="checkbox"
                      checked={(q.correctAnswers || []).includes(oIdx)}
                      onChange={() => toggleCorrect(qIdx, oIdx)}
                    />
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    value={opt}
                    onChange={(e) => setOption(qIdx, oIdx, e.target.value)}
                  />
                  <button type="button" className="btn btn-outline-secondary" onClick={() => removeOption(qIdx, oIdx)}>×</button>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-secondary mt-1" onClick={() => addOption(qIdx)}>+ Вариант</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline-primary mb-3" onClick={addQuestion}>+ Вопрос</button>
        {error && <div className="alert alert-danger">{error}</div>}
        <button type="submit" className="btn btn-primary me-2">Сохранить</button>
        <Link to={`/quizzes/${id}`} className="btn btn-secondary">Отмена</Link>
      </form>
    </div>
  );
}
