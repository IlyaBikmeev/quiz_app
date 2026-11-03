import { Badge, Box, Button, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight, IconHistory } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../api/client';
import { EmptyState, ErrorState, LoadingState } from '../components/PageState';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

function AttemptRow({ attempt }) {
  const active = !attempt.completedAt;
  const href = active
    ? `/quizzes/${attempt.quizId}/play`
    : `/quizzes/${attempt.quizId}/play?attempt=${attempt.id}`;
  const result = active
    ? `${attempt.answeredQuestions} из ${attempt.totalQuestions} вопросов`
    : `${attempt.correctAnswers} из ${attempt.totalQuestions} правильных`;

  return (
    <Group justify="space-between" wrap="wrap" p="md" align="center">
      <Box flex="1 1 220px" miw={0}>
        <Group gap="xs" mb={2}>
          <Text component={Link} to={href} fw={600} c="dark" td="none">{attempt.quizTitle || 'Без названия'}</Text>
          {active && <Badge variant="light">Не завершено</Badge>}
        </Group>
        <Text size="sm" c="dimmed">{result} · {dateFormatter.format(new Date(attempt.startedAt))}</Text>
      </Box>
      <Button component={Link} to={href} variant={active ? 'filled' : 'default'} rightSection={<IconArrowRight size={16} />} w={{ base: '100%', xs: 'auto' }} h={44}>
        {active ? 'Продолжить' : 'Посмотреть'}
      </Button>
    </Group>
  );
}

function AttemptList({ attempts }) {
  return (
    <Paper withBorder>
      <Stack gap={0}>
        {attempts.map((attempt, index) => (
          <div key={attempt.id}>
            {index > 0 && <Divider />}
            <AttemptRow attempt={attempt} />
          </div>
        ))}
      </Stack>
    </Paper>
  );
}

export function AttemptsPage() {
  const [attempts, setAttempts] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    apiJson('/api/v1/users/me/attempts').then(setAttempts).catch(() => setError('Не удалось загрузить попытки.'));
  }, []);
  useEffect(() => { load(); }, [load]);

  const { active, completed } = useMemo(() => ({
    active: attempts?.filter((attempt) => !attempt.completedAt) || [],
    completed: attempts?.filter((attempt) => attempt.completedAt)
      .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt)) || [],
  }), [attempts]);

  if (error) return <ErrorState title={error} onRetry={() => { setError(''); setAttempts(null); load(); }} />;
  if (!attempts) return <LoadingState label="Загрузка попыток…" />;

  return (
    <Stack gap="xl" maw={760} mx="auto">
      <Title order={1}>Мои попытки</Title>
      {!attempts.length && <EmptyState title="Попыток пока нет" message="Откройте тест и начните прохождение." />}
      {!!active.length && <Stack gap="sm"><Title order={2} size="h3">Продолжить</Title><AttemptList attempts={active} /></Stack>}
      {!!completed.length && <Stack gap="sm"><Group gap="xs"><IconHistory size={20} /><Title order={2} size="h3">Завершённые</Title></Group><AttemptList attempts={completed} /></Stack>}
    </Stack>
  );
}
