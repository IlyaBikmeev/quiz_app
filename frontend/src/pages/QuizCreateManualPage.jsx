import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';

function defaultQuestion() {
  return { text: '', options: [''], correctAnswers: [] };
}

export function QuizCreateManualPage() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const addQuestion = () => setQuestions((q) => [...q, defaultQuestion()]);
  const removeQuestion = (idx) => setQuestions((q) => q.filter((_, i) => i !== idx));

  const setQuestionText = (idx, text) => {
    setQuestions((q) => q.map((item, i) => (i === idx ? { ...item, text } : item)));
  };
  const setQuestionOptions = (idx, options) => {
    setQuestions((q) => q.map((item, i) => (i === idx ? { ...item, options } : item)));
  };
  const setQuestionCorrect = (idx, correctAnswers) => {
    setQuestions((q) => q.map((item, i) => (i === idx ? { ...item, correctAnswers } : item)));
  };

  const addOption = (qIdx) => {
    setQuestions((q) => q.map((item, i) =>
      i === qIdx ? { ...item, options: [...item.options, ''] } : item
    ));
  };
  const setOption = (qIdx, oIdx, value) => {
    setQuestions((q) => q.map((item, i) =>
      i === qIdx ? { ...item, options: item.options.map((o, j) => (j === oIdx ? value : o)) } : item
    ));
  };
  const removeOption = (qIdx, oIdx) => {
    setQuestions((q) => q.map((item, i) =>
      i === qIdx ? { ...item, options: item.options.filter((_, j) => j !== oIdx) } : item
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
        options: q.options.filter(Boolean),
        correctAnswers: (q.correctAnswers || []).sort((a, b) => a - b),
      })).filter((q) => q.text.trim()),
    };
    if (payload.questions.length === 0) {
      setError('Добавьте хотя бы один вопрос с текстом и вариантами.');
      return;
    }
    try {
      const res = await apiJson('/api/v1/quizzes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      navigate(res?.id ? `/quizzes/${res.id}` : '/quizzes');
    } catch (err) {
      setError(err.message || 'Ошибка сохранения');
    }
  };

  return (
    <div>
      <h1 className="mb-4">Создать квиз вручную</h1>
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
              {q.options.map((opt, oIdx) => (
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
        <button type="submit" className="btn btn-primary me-2">Создать квиз</button>
        <Link to="/quizzes/new" className="btn btn-secondary">Отмена</Link>
      </form>
    </div>
  );
}
