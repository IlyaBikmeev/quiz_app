import { Alert, Anchor, Button, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconAlertCircle, IconMail, IconUser } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiJson('/auth/register', { method: 'POST', body: JSON.stringify({ email, name }) });
      if (data.message?.includes('уже существует')) setError('Аккаунт с таким email уже существует.');
      else navigate('/verify', { state: { email } });
    } catch {
      setError('Не удалось зарегистрироваться. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper withBorder p="xl" maw={420} mx="auto">
      <form onSubmit={submit}>
        <Stack>
          <Title order={1} size="h2">Регистрация</Title>
          <TextInput label="Имя" required value={name} onChange={(event) => setName(event.currentTarget.value)} leftSection={<IconUser size={16} />} />
          <TextInput label="Email" type="email" required value={email} onChange={(event) => setEmail(event.currentTarget.value)} leftSection={<IconMail size={16} />} />
          {error && <Alert icon={<IconAlertCircle size={18} />} color="red">{error}</Alert>}
          <Button type="submit" loading={loading}>Зарегистрироваться</Button>
          <Text size="sm" ta="center">Уже есть аккаунт? <Anchor component={Link} to="/login">Войти</Anchor></Text>
        </Stack>
      </form>
    </Paper>
  );
}
