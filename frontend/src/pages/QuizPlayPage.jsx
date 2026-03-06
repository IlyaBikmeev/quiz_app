import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';

export function QuizPlayPage() {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const attempt = location.state?.attempt;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!attempt && !location.state) {
      navigate(`/quizzes/${quizId}`, { replace: true });
    }
  }, [attempt, quizId, location.state, navigate]);

  if (!attempt) return <div className="text-center">Нет данных о попытке. <Link to={`/quizzes/${quizId}`}>Вернуться к квизу</Link></div>;

  const questions = attempt.questions || [];
  const question = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!question) return;
    if (lastResult && currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected([]);
      setLastResult(null);
      return;
    }
    if (lastResult && currentIndex >= questions.length - 1) {
      setFinished(true);
      return;
    }
    setError('');
    const answers = Array.isArray(selected) ? [...selected] : [selected].filter((x) => x !== undefined && x !== null);
    try {
      const res = await apiJson(`/api/v1/attempts/${attempt.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          quizId: Number(quizId),
          questionId: question.id,
          answers: answers.sort((a, b) => a - b),
        }),
      });
      setLastResult(res);
      if (currentIndex >= questions.length - 1) {
        setFinished(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleOption = (idx) => {
    if (question?.isMultipleChoice) {
      setSelected((s) => (s.includes(idx) ? s.filter((i) => i !== idx) : [...s, idx]));
    } else {
      setSelected([idx]);
    }
  };

  if (finished && lastResult) {
    return (
      <div>
        <h2>Результат</h2>
        <p>Правильных ответов: {lastResult.correctAnswersCount} из {lastResult.totalQuestions}</p>
        <Link to={`/quizzes/${quizId}`} className="btn btn-primary">К деталям квиза</Link>
        <Link to="/quizzes" className="btn btn-secondary ms-2">К списку квизов</Link>
      </div>
    );
  }

  if (!question) return <div className="text-center">Нет вопросов. <Link to={`/quizzes/${quizId}`}>Вернуться</Link></div>;

  return (
    <div>
      <p className="text-muted">Вопрос {currentIndex + 1} из {questions.length}</p>
      <h4 className="mb-3">{question.text}</h4>
      <div className="mb-3">
        {(question.options || []).map((opt, idx) => (
          <div key={idx} className="form-check">
            <input
              type={question.isMultipleChoice ? 'checkbox' : 'radio'}
              className="form-check-input"
              name="option"
              id={`opt-${idx}`}
              checked={selected.includes(idx)}
              onChange={() => toggleOption(idx)}
            />
            <label className="form-check-label" htmlFor={`opt-${idx}`}>{opt}</label>
          </div>
        ))}
      </div>
      {lastResult && (
        <div className={`alert ${lastResult.correct ? 'alert-success' : 'alert-warning'}`}>
          {lastResult.correct ? 'Верно!' : 'Неправильно.'}
          {lastResult.correctAnswers?.length > 0 && (
            <span> Правильные варианты: {lastResult.correctAnswers.map((i) => (question.options || [])[i]).filter(Boolean).join(', ')}</span>
          )}
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      <button type="button" className="btn btn-primary" onClick={handleSubmitAnswer}>
        {lastResult ? (currentIndex >= questions.length - 1 ? 'Завершить' : 'Далее') : 'Ответить'}
      </button>
      <Link to={`/quizzes/${quizId}`} className="btn btn-link">Выйти</Link>
    </div>
  );
}
