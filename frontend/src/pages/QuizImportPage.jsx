import { Alert, Anchor, Button, Code, FileInput, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconFile, IconUpload } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../api/client';

export function QuizImportPage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return setError('Выберите файл .txt или .md.');
    setLoading(true);
    setError('');
    const body = new FormData();
    body.append('file', file);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiUrl()}/api/v1/quizzes/import`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'X-Requested-With': 'XMLHttpRequest' } : {}, credentials: 'include', body });
      if (!response.ok) throw new Error();
      const data = await response.json();
      notifications.show({ color: 'green', message: 'Квиз импортирован' });
      navigate(data?.id ? `/quizzes/${data.id}` : '/quizzes');
    } catch {
      setError('Не удалось импортировать файл. Проверьте формат.');
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg" maw={600} mx="auto">
      <Anchor component={Link} to="/quizzes" size="sm">← Все квизы</Anchor>
      <Title order={1}>Импорт квиза</Title>
      <form onSubmit={submit}>
        <Stack>
          <FileInput label="Файл" description="TXT или Markdown" placeholder="Выберите файл" accept=".txt,.md,text/plain,text/markdown" value={file} onChange={(value) => { setFile(value); setError(''); }} leftSection={<IconFile size={16} />} clearable />
          {error && <Alert icon={<IconAlertCircle size={18} />} color="red">{error}</Alert>}
          <Group justify="flex-end"><Button component={Link} to="/quizzes" variant="default">Отмена</Button><Button type="submit" leftSection={<IconUpload size={16} />} loading={loading}>Импортировать</Button></Group>
        </Stack>
      </form>
      <Paper withBorder p="md">
        <Stack gap="xs"><Text fw={600}>Формат файла</Text><Text size="sm" c="dimmed">Каждый вопрос начинается с <Code>Question:</Code>, варианты — с <Code>Options:</Code>. Правильный ответ отмечается <Code>[*]</Code>.</Text><Code block>{`Question: Столица России?\nOptions:\n[*] Москва\n[ ] Санкт-Петербург`}</Code></Stack>
      </Paper>
    </Stack>
  );
}
