import { Alert, Anchor, Badge, Button, Checkbox, Drawer, Grid, Group, List, Paper, Progress, Radio, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { IconAlertCircle, IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { apiFetch, apiJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/PageState';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function QuizPlayPage() {
  const { quizId } = useParams();
  const location = useLocation();
  const reviewAttemptId = new URLSearchParams(location.search).get('attempt');
  const [attempt, setAttempt] = useState(reviewAttemptId ? null : location.state?.attempt || null);
  const [quizTitle, setQuizTitle] = useState(location.state?.quizTitle || 'Квиз');
  const [loading, setLoading] = useState(!location.state?.attempt);
  const [loadError, setLoadError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [progress, setProgress] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [navigatorOpened, navigator] = useDisclosure(false);

  const applyAttempt = useCallback((data) => {
    setAttempt(data);
    const nextProgress = (data.questions || []).map((question, index) =>
      typeof question.correct === 'boolean' ? question.correct : data.progress?.[index] ?? null
    );
    setProgress(nextProgress);
    setDrafts(Object.fromEntries((data.questions || []).map((question) => [question.id, question.selectedAnswers || []])));
    const unanswered = nextProgress.findIndex((value) => value == null);
    if (data.completedAt) {
      setFinished(true);
      setElapsed(Math.max(0, Math.floor((new Date(data.completedAt) - new Date(data.startedAt)) / 1000)));
    }
    setCurrentIndex(unanswered >= 0 ? unanswered : 0);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [attemptData, quizData] = await Promise.all([apiJson(reviewAttemptId ? `/api/v1/attempts/${reviewAttemptId}` : `/api/v1/quizzes/${quizId}/attempts`), apiJson(`/api/v1/quizzes/${quizId}`)]);
      applyAttempt(attemptData);
      if (reviewAttemptId) {
        setReviewing(true);
        setFinished(true);
        setCurrentIndex(0);
      }
      setQuizTitle(quizData.title || 'Квиз');
    } catch {
      setLoadError('Не удалось загрузить квиз.');
    } finally {
      setLoading(false);
    }
  }, [quizId, reviewAttemptId, applyAttempt]);

  useEffect(() => {
    if (attempt) {
      applyAttempt(attempt);
      if (!location.state?.quizTitle) apiJson(`/api/v1/quizzes/${quizId}`).then((data) => setQuizTitle(data.title)).catch(() => {});
      return;
    }
    load();
  }, [attempt?.id, quizId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!attempt?.startedAt || finished) return undefined;
    const started = new Date(attempt.startedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.startedAt, finished]);

  const questions = attempt?.questions || [];
  const question = questions[currentIndex];
  const multiple = question?.multipleChoice ?? question?.isMultipleChoice;
  const selected = drafts[question?.id] || [];

  const selectQuestion = (index) => {
    setCurrentIndex(index);
    setError('');
    navigator.close();
  };

  const submitAnswer = async () => {
    if (!selected.length) return setError('Выберите ответ.');
    setSubmitting(true);
    setError('');
    try {
      const result = await apiJson(`/api/v1/attempts/${attempt.id}/answer`, { method: 'POST', body: JSON.stringify({ quizId: Number(quizId), questionId: question.id, answers: [...selected].sort((a, b) => a - b) }) });
      setProgress((current) => current.map((value, index) => index === currentIndex ? result.correct : value));
      setAttempt((current) => ({ ...current, questions: current.questions.map((item, index) => index === currentIndex ? { ...item, selectedAnswers: [...selected], correctAnswers: result.correctAnswers, correct: result.correct } : item) }));
    } catch {
      setError('Не удалось проверить ответ. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    const nextUnanswered = progress.findIndex((value, index) => index > currentIndex && value == null);
    const firstUnanswered = progress.findIndex((value) => value == null);
    const nextIndex = nextUnanswered >= 0 ? nextUnanswered : firstUnanswered;
    if (nextIndex < 0) return setFinished(true);
    selectQuestion(nextIndex);
  };

  const finishEarly = () => {
    const unanswered = progress.filter((value) => value == null).length;
    modals.openConfirmModal({
      title: 'Завершить попытку?',
      children: <Text size="sm">Без ответа останется: {unanswered}.</Text>,
      labels: { confirm: 'Завершить', cancel: 'Продолжить' },
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const response = await apiFetch(`/api/v1/attempts/${attempt.id}/complete`, { method: 'POST' });
          if (!response.ok) throw new Error();
          setFinished(true);
        } catch {
          setError('Не удалось завершить попытку.');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const openReview = async () => {
    setSubmitting(true);
    try {
      const data = await apiJson(`/api/v1/attempts/${attempt.id}`);
      applyAttempt(data);
      setReviewing(true);
      setFinished(true);
      setCurrentIndex(0);
    } catch {
      setError('Не удалось загрузить ответы.');
    } finally {
      setSubmitting(false);
    }
  };

  const restart = async () => {
    setSubmitting(true);
    try {
      const data = await apiJson(`/api/v1/quizzes/${quizId}/attempts`);
      applyAttempt(data);
      setReviewing(false);
      setFinished(false);
      setElapsed(0);
    } catch {
      setError('Не удалось начать новую попытку.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Загрузка квиза…" />;
  if (loadError) return <ErrorState title={loadError} onRetry={load} />;
  if (!attempt || !questions.length) return <ErrorState title="В квизе нет вопросов" />;

  const correctCount = progress.filter((value) => value === true).length;
  const answeredCount = progress.filter((value) => value != null).length;
  const percent = Math.round((correctCount / questions.length) * 100);

  if (finished && !reviewing) {
    return (
      <Stack align="center" gap="lg" maw={520} mx="auto" ta="center">
        <Title order={1}>Результат</Title>
        <div><Title order={2} size={56}>{correctCount} из {questions.length}</Title><Text c="dimmed">{percent}% правильных ответов · {formatTime(elapsed)}</Text></div>
        {error && <Alert icon={<IconAlertCircle size={18} />} color="red">{error}</Alert>}
        <Group justify="center"><Button onClick={restart} loading={submitting}>Пройти ещё раз</Button><Button variant="default" onClick={openReview} disabled={submitting}>Посмотреть ответы</Button></Group>
        <Anchor component={Link} to="/quizzes">Вернуться к квизам</Anchor>
      </Stack>
    );
  }

  const displayedQuestion = questions[currentIndex];
  const reviewSelected = reviewing ? displayedQuestion.selectedAnswers || [] : drafts[displayedQuestion.id] || [];
  const correctAnswers = displayedQuestion.correctAnswers || [];
  const correct = displayedQuestion.correct;
  const locked = progress[currentIndex] != null || reviewing;
  const values = reviewSelected.map(String);
  const resultColor = correct === true ? 'green' : correct === false ? 'red' : 'gray';
  const resultTitle = correct === true ? 'Правильно' : correct === false ? 'Неправильно' : 'Нет ответа';
  const correctOptions = correctAnswers.map((index) => displayedQuestion.options[index]);
  const questionNavigator = (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600}>Вопросы</Text>
        <Badge variant="light">{answeredCount} из {questions.length}</Badge>
      </Group>
      <SimpleGrid cols={5} spacing="xs">
        {questions.map((item, index) => {
          const status = progress[index];
          const current = index === currentIndex;
          const label = status === true ? `✓ ${index + 1}` : status === false ? `× ${index + 1}` : String(index + 1);
          const statusLabel = status === true ? 'верно' : status === false ? 'неверно' : 'без ответа';
          return (
            <Button
              key={item.id}
              variant={current ? 'filled' : 'light'}
              color={status === true ? 'green' : status === false ? 'red' : current ? 'blue' : 'gray'}
              onClick={() => selectQuestion(index)}
              aria-label={`Вопрос ${index + 1}: ${statusLabel}`}
              aria-current={current ? 'step' : undefined}
              h={44}
              px="xs"
            >
              {label}
            </Button>
          );
        })}
      </SimpleGrid>
      <Text size="sm" c="dimmed">✓ верно · × неверно · номер — без ответа</Text>
    </Stack>
  );

  const options = (
    <Stack gap="sm">
      {displayedQuestion.options.map((option, index) => (
        <Stack key={`${displayedQuestion.id}-${index}`} gap={6}>
          {multiple ? <Checkbox value={String(index)} label={option} disabled={locked} /> : <Radio value={String(index)} label={option} disabled={locked} />}
          {locked && (reviewSelected.includes(index) || correctAnswers.includes(index)) && <Group gap="xs" wrap="wrap" pl={28}>{reviewSelected.includes(index) && <Badge variant="light" color={correctAnswers.includes(index) ? 'green' : 'red'}>Ваш ответ</Badge>}{correctAnswers.includes(index) && <Badge variant="light" color="green">Правильный</Badge>}</Group>}
        </Stack>
      ))}
    </Stack>
  );

  return (
    <Stack maw={1040} mx="auto" gap="lg">
      <Group justify="space-between"><div><Text fw={600}>{reviewing ? 'Разбор ответов' : quizTitle}</Text><Text size="sm" c="dimmed">Вопрос {currentIndex + 1} из {questions.length}</Text></div><Group gap="xs"><IconClock size={16} /><Text size="sm">{formatTime(elapsed)}</Text></Group></Group>
      <Progress value={(answeredCount / questions.length) * 100} aria-label={`Отвечено ${answeredCount} из ${questions.length}`} />
      <Button hiddenFrom="md" variant="default" h={44} onClick={navigator.open}>Все вопросы · {answeredCount}/{questions.length}</Button>
      <Drawer opened={navigatorOpened} onClose={navigator.close} title="Навигация по вопросам" position="right" size="xs" closeButtonProps={{ size: 44 }}>
        {questionNavigator}
      </Drawer>
      <Grid align="flex-start" gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p="xl">
            <Stack gap="lg">
              <Title order={1} size="h2">{displayedQuestion.text}</Title>
              <Text size="sm" c="dimmed">{multiple ? 'Можно выбрать несколько вариантов.' : 'Выберите один вариант.'}</Text>
              {multiple ? <Checkbox.Group value={values} onChange={(nextValues) => { setDrafts((current) => ({ ...current, [displayedQuestion.id]: nextValues.map(Number) })); setError(''); }}>{options}</Checkbox.Group> : <Radio.Group value={values[0] || ''} onChange={(value) => { setDrafts((current) => ({ ...current, [displayedQuestion.id]: [Number(value)] })); setError(''); }}>{options}</Radio.Group>}
              {locked && <Alert color={resultColor} icon={correct === true ? <IconCheck size={18} /> : <IconX size={18} />} title={resultTitle}>{correct === false && (correctOptions.length > 1 ? <Stack gap="xs"><Text size="sm">Правильные ответы:</Text><List size="sm" spacing={4}>{correctOptions.map((option, index) => <List.Item key={`${index}-${option}`}>{option}</List.Item>)}</List></Stack> : <Stack gap={4}><Text size="sm">Правильный ответ:</Text><Text size="sm">{correctOptions[0]}</Text></Stack>)}</Alert>}
              {error && <Alert color="red" icon={<IconAlertCircle size={18} />}>{error}</Alert>}
              <Group justify="flex-end">
                {reviewing ? <Button h={44} w={{ base: '100%', xs: 'auto' }} onClick={() => setReviewing(false)}>К результату</Button> : locked ? <Button h={44} w={{ base: '100%', xs: 'auto' }} onClick={next}>{answeredCount === questions.length ? 'Показать результат' : 'К следующему без ответа'}</Button> : <Button h={44} w={{ base: '100%', xs: 'auto' }} onClick={submitAnswer} loading={submitting}>Проверить ответ</Button>}
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }} visibleFrom="md">
          <Paper withBorder p="md">{questionNavigator}</Paper>
        </Grid.Col>
      </Grid>
      {!reviewing && <Button variant="subtle" color="gray" mx="auto" h={44} onClick={finishEarly} disabled={submitting}>Завершить попытку</Button>}
    </Stack>
  );
}
