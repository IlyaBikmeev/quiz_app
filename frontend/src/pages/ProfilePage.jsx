import { Avatar, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';
import { ErrorState, LoadingState } from '../components/PageState';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const { setToken } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { apiJson('/api/v1/users/me').then(setUser).catch(() => setError('Не удалось загрузить профиль.')); }, []);
  if (error) return <ErrorState title={error} />;
  if (!user) return <LoadingState label="Загрузка профиля…" />;
  const logout = () => { setToken(null); navigate('/login'); };
  return (
    <Stack maw={600} mx="auto">
      <Title order={1}>Профиль</Title>
      <Paper withBorder p="lg">
        <Group justify="space-between" align="center">
          <Group><Avatar size="lg" color="blue">{(user.name || user.email || '?')[0].toUpperCase()}</Avatar><div><Text fw={600}>{user.name || 'Имя не указано'}</Text><Text c="dimmed" size="sm">{user.email}</Text></div></Group>
          <Button color="red" variant="subtle" leftSection={<IconLogout size={16} />} onClick={logout}>Выйти</Button>
        </Group>
      </Paper>
    </Stack>
  );
}
