import { ActionIcon, Button, Divider, Group, Pagination, Paper, Stack, Text, Title } from '@mantine/core';
import { IconFileImport, IconPlus, IconPlayerPlay } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../api/client';
import { EmptyState, ErrorState, LoadingState } from '../components/PageState';

export function QuizzesPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiJson(`/api/v1/quizzes?page=${page - 1}&size=10`)
      .then((response) => !cancelled && setData(response))
      .catch(() => !cancelled && setError('Не удалось загрузить квизы.'));
    return () => { cancelled = true; };
  }, [page, requestKey]);

  if (error) return <ErrorState title={error} onRetry={() => { setError(''); setData(null); setRequestKey((value) => value + 1); }} />;
  if (!data) return <LoadingState label="Загрузка квизов…" />;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1}>Мои квизы</Title>
        <Group gap="xs">
          <Button component={Link} to="/quizzes/import" variant="default" leftSection={<IconFileImport size={16} />} visibleFrom="sm">Импортировать</Button>
          <Button component={Link} to="/quizzes/new" leftSection={<IconPlus size={16} />}>Создать</Button>
        </Group>
      </Group>

      {data.content?.length === 0 ? (
        <EmptyState title="Квизов пока нет" message="Создайте квиз вручную или импортируйте вопросы из файла.">
          <Group justify="center"><Button component={Link} to="/quizzes/new">Создать квиз</Button><Button component={Link} to="/quizzes/import" variant="default">Импортировать</Button></Group>
        </EmptyState>
      ) : (
        <Paper withBorder>
          <Stack gap={0}>
            {data.content.map((quiz, index) => (
              <div key={quiz.id}>
                {index > 0 && <Divider />}
                <Group justify="space-between" wrap="nowrap" p="md">
                  <div><Text component={Link} to={`/quizzes/${quiz.id}`} fw={600} c="dark" td="none">{quiz.title || 'Без названия'}</Text><Text size="sm" c="dimmed">{quiz.questions?.length || 0} вопросов</Text></div>
                  <Button component={Link} to={`/quizzes/${quiz.id}`} variant="light" leftSection={<IconPlayerPlay size={16} />} visibleFrom="xs">Открыть</Button>
                  <ActionIcon component={Link} to={`/quizzes/${quiz.id}`} variant="light" aria-label={`Открыть ${quiz.title}`} size="lg" hiddenFrom="xs"><IconPlayerPlay size={18} /></ActionIcon>
                </Group>
              </div>
            ))}
          </Stack>
        </Paper>
      )}

      {data.totalPages > 1 && <Pagination total={data.totalPages} value={page} onChange={(value) => { setPage(value); setData(null); }} mx="auto" />}
    </Stack>
  );
}
