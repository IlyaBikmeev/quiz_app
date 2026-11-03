import { Alert, Anchor, Button, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconAlertCircle, IconMail } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiJson('/auth/login', { method: 'POST', body: JSON.stringify({ email }) });
      if (data.message?.includes('не найден')) setError('Аккаунт с таким email не найден.');
      else navigate('/verify', { state: { email } });
    } catch {
      setError('Не удалось отправить код. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper withBorder p="xl" maw={420} mx="auto">
      <form onSubmit={submit}>
        <Stack>
          <div><Title order={1} size="h2">Вход</Title><Text c="dimmed" size="sm">Код придёт на почту.</Text></div>
          <TextInput label="Email" type="email" required autoFocus value={email} onChange={(event) => setEmail(event.currentTarget.value)} leftSection={<IconMail size={16} />} />
          {error && <Alert icon={<IconAlertCircle size={18} />} color="red">{error}</Alert>}
          <Button type="submit" loading={loading}>Получить код</Button>
          <Text size="sm" ta="center">Нет аккаунта? <Anchor component={Link} to="/register">Зарегистрироваться</Anchor></Text>
        </Stack>
      </form>
    </Paper>
  );
}
