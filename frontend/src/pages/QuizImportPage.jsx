import { Alert, Anchor, Button, Code, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
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
    if (!file) return setError('Перетащите или выберите файл .txt или .md.');
    setLoading(true);
    setError('');
    const body = new FormData();
    body.append('file', file);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiUrl()}/api/v1/quizzes/import`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'X-Requested-With': 'XMLHttpRequest' } : {}, credentials: 'include', body });
      if (!response.ok) throw new Error();
      const data = await response.json();
      notifications.show({ color: 'green', message: 'Тест импортирован' });
      navigate(data?.id ? `/quizzes/${data.id}` : '/quizzes');
    } catch {
      setError('Не удалось импортировать файл. Проверьте формат.');
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg" maw={600} mx="auto">
      <Anchor component={Link} to="/quizzes" size="sm">← Все тесты</Anchor>
      <Title order={1}>Импорт теста</Title>
      <form onSubmit={submit}>
        <Stack>
          <Dropzone
            accept={{ 'text/plain': ['.txt'], 'text/markdown': ['.md'] }}
            multiple={false}
            maxFiles={1}
            loading={loading}
            onDrop={(files) => { setFile(files[0]); setError(''); }}
            onReject={() => setError('Подойдёт файл в формате TXT или Markdown.')}
            aria-label="Загрузить файл теста"
          >
            <Group justify="center" gap="md" mih={120} wrap="nowrap">
              <IconFile size={32} />
              <Stack gap={2}>
                <Text fw={600}>{file ? file.name : 'Перетащите файл сюда'}</Text>
                <Text size="sm" c="dimmed">{file ? 'Перетащите другой файл или нажмите, чтобы заменить' : 'или нажмите, чтобы выбрать · TXT или Markdown'}</Text>
              </Stack>
            </Group>
          </Dropzone>
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
