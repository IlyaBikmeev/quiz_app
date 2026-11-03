import { ActionIcon, AppShell, Button, Container, Group, Menu, Text, Title } from '@mantine/core';
import { IconLogout, IconPlus, IconUser } from '@tabler/icons-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { valid, validUnknown, setToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="md" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Title order={3} component={Link} to={valid ? '/quizzes' : '/'} c="dark" td="none">
              QuizForge
            </Title>

            {!validUnknown && valid && (
              <Group gap="xs" wrap="nowrap">
                <Button component={Link} to="/quizzes" variant={location.pathname === '/quizzes' ? 'light' : 'subtle'} color="dark">
                  Квизы
                </Button>
                <Button component={Link} to="/quizzes/new" leftSection={<IconPlus size={16} />} visibleFrom="xs">
                  Создать
                </Button>
                <ActionIcon component={Link} to="/quizzes/new" aria-label="Создать квиз" size="lg" hiddenFrom="xs">
                  <IconPlus size={20} />
                </ActionIcon>
                <Menu position="bottom-end" width={180}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="dark" size="lg" aria-label="Меню профиля">
                      <IconUser size={20} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item component={Link} to="/profile" leftSection={<IconUser size={16} />}>Профиль</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={logout}>Выйти</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            )}

            {!validUnknown && !valid && (
              <Group gap="xs">
                <Button component={Link} to="/login" variant="subtle" color="dark">Войти</Button>
                <Button component={Link} to="/register">Регистрация</Button>
              </Group>
            )}

            {validUnknown && <Text size="sm" c="dimmed">Проверка…</Text>}
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="md" py="xl">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
