import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { apiJson, apiFetch } from '../api/client';

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function QuizPlayPage() {
  const { quizId } = useParams();
  const location = useLocation();

  const [attempt, setAttempt] = useState(null);
  const [loadingAttempt, setLoadingAttempt] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [resultsByIndex, setResultsByIndex] = useState([]);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalTimeSeconds, setFinalTimeSeconds] = useState(null);
  const startedAtRef = useRef(null);

  // Always request current attempt on mount and when quizId changes (including after refresh).
  useEffect(() => {
    if (!quizId) return;
    setLoadingAttempt(true);
    setLoadError('');
    let cancelled = false;
    apiFetch(`/api/v1/quizzes/${quizId}/attempts`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const text = await res.text();
          setLoadError(text || `HTTP ${res.status}`);
          setLoadingAttempt(false);
          return;
        }
        const data = await res.json();
        setAttempt(data);
        const questions = data.questions || [];
        const progress = data.progress || [];
        const results = questions.map((_, i) => {
          const v = progress[i];
          return v === true || v === false ? v : null;
        });
        const firstUnanswered = results.findIndex((r) => r === null || r === undefined);
        setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
        setResultsByIndex(results);
        setLoadingAttempt(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message || 'Ошибка загрузки');
          setLoadingAttempt(false);
        }
      });
    return () => { cancelled = true; };
  }, [quizId]);

  useEffect(() => {
    if (attempt && startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }
  }, [attempt]);

  useEffect(() => {
    if (!attempt || finished) return;
    const id = setInterval(() => {
      if (startedAtRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [attempt, finished]);

  if (loadingAttempt) return <div className="text-center">Загрузка…</div>;
  if (loadError) return <div className="text-center"><div className="alert alert-danger">{loadError}</div><Link to={`/quizzes/${quizId}`}>Вернуться к квизу</Link></div>;
  if (!attempt) return null;

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
    const answers = Array.isArray(selected) ? [...selected] : [selected].filter((x) => x !== undefined && x !== null);
    if (answers.length === 0) {
      setError('Выберите хотя бы один вариант.');
      return;
    }
    setError('');
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
      setResultsByIndex((prev) => {
        const next = [...prev];
        while (next.length <= currentIndex) next.push(null);
        next[currentIndex] = res.correct;
        return next;
      });
      if (currentIndex >= questions.length - 1) {
        setFinalTimeSeconds(Math.floor((Date.now() - (startedAtRef.current || Date.now())) / 1000));
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
    const finalCorrectCount = resultsByIndex.filter((r) => r === true).length;
    const finalTotalCount = questions.length;
    const finalPercent = finalTotalCount ? Math.round((finalCorrectCount / finalTotalCount) * 100) : 0;
    const displayTime = finalTimeSeconds != null ? formatTime(finalTimeSeconds) : formatTime(elapsedSeconds);
    return (
      <div>
        <h2>Результат</h2>
        <p>Правильных ответов: {finalCorrectCount} из {finalTotalCount} ({finalPercent}%)</p>
        <p className="text-muted">Время: {displayTime}</p>
        <Link to={`/quizzes/${quizId}`} className="btn btn-primary">К деталям квиза</Link>
        <Link to="/quizzes" className="btn btn-secondary ms-2">К списку квизов</Link>
      </div>
    );
  }

  if (!question) return <div className="text-center">Нет вопросов. <Link to={`/quizzes/${quizId}`}>Вернуться</Link></div>;

  const totalCount = questions.length;
  const correctCount = resultsByIndex.filter((r) => r === true).length;
  const percent = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
        <div className="d-flex flex-wrap gap-1 align-items-center">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`d-inline-block rounded border text-center ${i === currentIndex ? 'border-primary border-2' : ''}`}
              style={{
                width: 28,
                height: 28,
                lineHeight: '26px',
                fontSize: 12,
                backgroundColor: resultsByIndex[i] === true ? 'var(--bs-success)' : resultsByIndex[i] === false ? 'var(--bs-danger)' : 'var(--bs-secondary-bg)',
                color: resultsByIndex[i] != null ? 'white' : 'inherit',
              }}
              title={`Вопрос ${i + 1}${resultsByIndex[i] === true ? ' — верно' : resultsByIndex[i] === false ? ' — неверно' : ''}`}
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted small">
            Правильно: {correctCount} из {totalCount} ({percent}%)
          </span>
          <span className="text-muted small fw-medium">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>
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
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmitAnswer}
        disabled={!lastResult && selected.length === 0}
      >
        {lastResult ? (currentIndex >= questions.length - 1 ? 'Завершить' : 'Далее') : 'Ответить'}
      </button>
      <Link to={`/quizzes/${quizId}`} className="btn btn-link">Выйти</Link>
    </div>
  );
}
