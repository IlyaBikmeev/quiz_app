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
  const [reviewAfterFinish, setReviewAfterFinish] = useState(false);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalTimeSeconds, setFinalTimeSeconds] = useState(null);

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

  // Timer: elapsed = now - attempt.startedAt from server (so refresh doesn't break the counter).
  useEffect(() => {
    if (!attempt?.startedAt || finished) return;
    const startMs = new Date(attempt.startedAt).getTime();
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [attempt?.startedAt, finished]);

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
      const sortedAnswers = answers.sort((a, b) => a - b);
      setResultsByIndex((prev) => {
        const next = [...prev];
        while (next.length <= currentIndex) next.push(null);
        next[currentIndex] = res.correct;
        return next;
      });
      setAttempt((prev) => ({
        ...prev,
        questions: (prev.questions || []).map((q, idx) =>
          idx === currentIndex
            ? { ...q, selectedAnswers: sortedAnswers, correctAnswers: res.correctAnswers || [], correct: res.correct }
            : q
        ),
      }));
      if (currentIndex >= questions.length - 1) {
        const startMs = attempt.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
        setFinalTimeSeconds(Math.floor((Date.now() - startMs) / 1000));
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

  const goToQuestion = (i) => {
    setCurrentIndex(i);
    setLastResult(null);
    setSelected([]);
  };

  const isReviewMode = resultsByIndex[currentIndex] != null;

  if (finished && lastResult && !reviewAfterFinish) {
    const finalCorrectCount = resultsByIndex.filter((r) => r === true).length;
    const finalTotalCount = questions.length;
    const finalPercent = finalTotalCount ? Math.round((finalCorrectCount / finalTotalCount) * 100) : 0;
    let displayTime = formatTime(elapsedSeconds);
    if (finalTimeSeconds != null) displayTime = formatTime(finalTimeSeconds);
    else if (attempt?.completedAt && attempt?.startedAt) {
      const sec = Math.floor((new Date(attempt.completedAt) - new Date(attempt.startedAt)) / 1000);
      displayTime = formatTime(sec);
    }
    const handleShowReview = () => {
      apiJson(`/api/v1/attempts/${attempt.id}`)
        .then((data) => {
          setAttempt(data);
          setReviewAfterFinish(true);
          setCurrentIndex(0);
        })
        .catch((err) => setError(err.message || 'Ошибка загрузки'));
    };
    return (
      <div>
        <h2>Результат</h2>
        <p>Правильных ответов: {finalCorrectCount} из {finalTotalCount} ({finalPercent}%)</p>
        <p className="text-muted">Время: {displayTime}</p>
        <button type="button" className="btn btn-outline-primary me-2" onClick={handleShowReview}>
          Посмотреть ответы
        </button>
        <Link to={`/quizzes/${quizId}`} className="btn btn-primary">К деталям квиза</Link>
        <Link to="/quizzes" className="btn btn-secondary ms-2">К списку квизов</Link>
      </div>
    );
  }

  if (finished && reviewAfterFinish) {
    const reviewProgress = attempt.progress || [];
    const reviewQuestion = questions[currentIndex];
    const reviewSelected = reviewQuestion?.selectedAnswers ?? [];
    const reviewCorrectAnswers = reviewQuestion?.correctAnswers ?? [];
    const reviewCorrect = reviewQuestion?.correct;
    return (
      <div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
          <div className="d-flex flex-wrap gap-1 align-items-center">
            {questions.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`d-inline-block rounded border text-center ${i === currentIndex ? 'border-primary border-2' : ''}`}
                style={{
                  width: 28,
                  height: 28,
                  lineHeight: '26px',
                  fontSize: 12,
                  backgroundColor: reviewProgress[i] === true ? 'var(--bs-success)' : reviewProgress[i] === false ? 'var(--bs-danger)' : 'var(--bs-secondary-bg)',
                  color: reviewProgress[i] != null ? 'white' : 'inherit',
                }}
                onClick={() => goToQuestion(i)}
                title={`Вопрос ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setReviewAfterFinish(false)}>
            К результату
          </button>
        </div>
        {reviewQuestion && (
          <>
            <p className="text-muted">Вопрос {currentIndex + 1} из {questions.length}</p>
            <h4 className="mb-3">{reviewQuestion.text}</h4>
            <div className={`alert ${reviewCorrect ? 'alert-success' : 'alert-danger'} mb-3`}>
              {reviewCorrect ? 'Верно' : 'Неправильно'}
            </div>
            <div className="mb-3">
              {(reviewQuestion.options || []).map((opt, idx) => {
                const isSelected = reviewSelected.includes(idx);
                const isCorrectOpt = reviewCorrectAnswers.includes(idx);
                return (
                  <div key={idx} className="form-check">
                    <input
                      type={reviewQuestion.isMultipleChoice ? 'checkbox' : 'radio'}
                      className="form-check-input"
                      disabled
                      checked={isSelected}
                      readOnly
                    />
                    <label className="form-check-label">
                      {opt}
                      {isSelected && <span className="text-primary ms-1">(ваш ответ)</span>}
                      {isCorrectOpt && !isSelected && <span className="text-success ms-1">(правильный ответ)</span>}
                      {isCorrectOpt && isSelected && <span className="text-success ms-1">(правильный ответ)</span>}
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="d-flex gap-2">
              {currentIndex > 0 && (
                <button type="button" className="btn btn-outline-primary" onClick={() => goToQuestion(currentIndex - 1)}>
                  Назад
                </button>
              )}
              {currentIndex < questions.length - 1 ? (
                <button type="button" className="btn btn-primary" onClick={() => goToQuestion(currentIndex + 1)}>
                  Вперёд
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    );
  }

  if (!question) return <div className="text-center">Нет вопросов. <Link to={`/quizzes/${quizId}`}>Вернуться</Link></div>;

  const totalCount = questions.length;
  const correctCount = resultsByIndex.filter((r) => r === true).length;
  const percent = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;

  const reviewSelected = question?.selectedAnswers ?? [];
  const reviewCorrectAnswers = question?.correctAnswers ?? [];
  const reviewCorrect = question?.correct;

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
        <div className="d-flex flex-wrap gap-1 align-items-center">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`d-inline-block rounded border text-center ${i === currentIndex ? 'border-primary border-2' : ''}`}
              style={{
                width: 28,
                height: 28,
                lineHeight: '26px',
                fontSize: 12,
                backgroundColor: resultsByIndex[i] === true ? 'var(--bs-success)' : resultsByIndex[i] === false ? 'var(--bs-danger)' : 'var(--bs-secondary-bg)',
                color: resultsByIndex[i] != null ? 'white' : 'inherit',
              }}
              onClick={() => goToQuestion(i)}
              title={`Вопрос ${i + 1}${resultsByIndex[i] === true ? ' — верно' : resultsByIndex[i] === false ? ' — неверно' : ''}`}
            >
              {i + 1}
            </button>
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

      {isReviewMode ? (
        <>
          <div className={`alert ${reviewCorrect ? 'alert-success' : 'alert-danger'} mb-3`}>
            {reviewCorrect ? 'Верно' : 'Неправильно'}
          </div>
          <div className="mb-3">
            {(question.options || []).map((opt, idx) => {
              const isSelected = reviewSelected.includes(idx);
              const isCorrectOpt = reviewCorrectAnswers.includes(idx);
              return (
                <div key={idx} className="form-check">
                  <input
                    type={question.isMultipleChoice ? 'checkbox' : 'radio'}
                    className="form-check-input"
                    disabled
                    checked={isSelected}
                    readOnly
                  />
                  <label className="form-check-label">
                    {opt}
                    {isSelected && <span className="text-primary ms-1">(ваш ответ)</span>}
                    {isCorrectOpt && !isSelected && <span className="text-success ms-1">(правильный ответ)</span>}
                    {isCorrectOpt && isSelected && <span className="text-success ms-1">(правильный ответ)</span>}
                  </label>
                </div>
              );
            })}
          </div>
          <div className="d-flex gap-2 align-items-center">
            {currentIndex > 0 && (
              <button type="button" className="btn btn-outline-primary" onClick={() => goToQuestion(currentIndex - 1)}>
                Назад
              </button>
            )}
            {currentIndex < questions.length - 1 && (
              <button type="button" className="btn btn-primary" onClick={() => goToQuestion(currentIndex + 1)}>
                Вперёд
              </button>
            )}
            <Link to={`/quizzes/${quizId}`} className="btn btn-link ms-2">Выйти</Link>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
