import { Alert, Anchor, Button, Divider, Group, List, Menu, Paper, Stack, Text, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconDots, IconEdit, IconPlayerPlay, IconTrash } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch, apiJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/PageState';

export function QuizDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const loadQuiz = useCallback(() => {
    setQuiz(null);
    setError('');
    apiJson(`/api/v1/quizzes/${id}`).then(setQuiz).catch(() => setError('Не удалось загрузить квиз.'));
  }, [id]);
  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  const start = async () => {
    setStarting(true);
    try {
      const attempt = await apiJson(`/api/v1/quizzes/${id}/attempts`);
      navigate(`/quizzes/${id}/play`, { state: { attempt, quizTitle: quiz.title } });
    } catch {
      notifications.show({ color: 'red', title: 'Не удалось начать квиз', message: 'Попробуйте ещё раз.' });
      setStarting(false);
    }
  };

  const remove = () => modals.openConfirmModal({
    title: `Удалить «${quiz.title}»?`,
    children: <Text size="sm">Квиз и связанные попытки будут удалены без возможности восстановления.</Text>,
    labels: { confirm: 'Удалить', cancel: 'Отмена' },
    confirmProps: { color: 'red' },
    onConfirm: async () => {
      try {
        const response = await apiFetch(`/api/v1/quizzes/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error();
        navigate('/quizzes');
      } catch {
        notifications.show({ color: 'red', title: 'Не удалось удалить квиз', message: 'Попробуйте ещё раз.' });
      }
    },
  });

  if (error) return <ErrorState title={error} onRetry={loadQuiz} />;
  if (!quiz) return <LoadingState label="Загрузка квиза…" />;

  return (
    <Stack gap="lg" maw={760} mx="auto">
      <Anchor component={Link} to="/quizzes" size="sm">← Все квизы</Anchor>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div><Title order={1}>{quiz.title}</Title><Text c="dimmed">{quiz.questions?.length || 0} вопросов</Text></div>
        {quiz.canEdit && <Menu position="bottom-end"><Menu.Target><Button variant="default" px="xs" aria-label="Действия"><IconDots size={18} /></Button></Menu.Target><Menu.Dropdown><Menu.Item component={Link} to={`/quizzes/${quiz.id}/edit`} leftSection={<IconEdit size={16} />}>Редактировать</Menu.Item><Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={remove}>Удалить</Menu.Item></Menu.Dropdown></Menu>}
      </Group>
      {!quiz.questions?.length && <Alert icon={<IconAlertCircle size={18} />} color="yellow">В квизе нет вопросов.</Alert>}
      <Button size="md" leftSection={<IconPlayerPlay size={18} />} onClick={start} loading={starting} disabled={!quiz.questions?.length}>Начать квиз</Button>
      <Paper withBorder p="lg">
        <Title order={2} size="h3" mb="sm">Вопросы</Title>
        <List type="ordered" spacing="sm">{quiz.questions?.map((question) => <List.Item key={question.id}>{question.text}<Text component="span" size="sm" c="dimmed"> · {question.options?.length || 0} вариантов</Text></List.Item>)}</List>
        {!quiz.questions?.length && <Text c="dimmed" size="sm">Список пуст.</Text>}
      </Paper>
    </Stack>
  );
}
