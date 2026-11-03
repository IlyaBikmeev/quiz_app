import { ActionIcon, AppShell, Button, Container, Divider, Drawer, Group, Menu, NavLink, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHistory, IconList, IconLogout, IconMenu2, IconUser } from '@tabler/icons-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { valid, validUnknown, setToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [navigationOpened, navigation] = useDisclosure(false);
  const quizzesActive = location.pathname.startsWith('/quizzes');

  const logout = () => {
    navigation.close();
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
                <Button component={Link} to="/quizzes" variant={location.pathname === '/quizzes' ? 'light' : 'subtle'} color="dark" visibleFrom="xs" h={44}>
                  Тесты
                </Button>
                <Button component={Link} to="/attempts" variant={location.pathname === '/attempts' ? 'light' : 'subtle'} color="dark" visibleFrom="sm">
                  Попытки
                </Button>
                <Menu position="bottom-end" width={180}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="dark" size={44} aria-label="Меню профиля" visibleFrom="xs">
                      <IconUser size={20} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item component={Link} to="/attempts" leftSection={<IconHistory size={16} />}>Мои попытки</Menu.Item>
                    <Menu.Item component={Link} to="/profile" leftSection={<IconUser size={16} />}>Профиль</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={logout}>Выйти</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
                <ActionIcon variant="subtle" color="dark" size={44} aria-label="Открыть меню" hiddenFrom="xs" onClick={navigation.open}>
                  <IconMenu2 size={22} />
                </ActionIcon>
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
      {valid && (
        <Drawer opened={navigationOpened} onClose={navigation.close} title="Меню" position="right" size="xs" hiddenFrom="xs" closeButtonProps={{ size: 44 }}>
          <Stack gap="xs">
            <NavLink component={Link} to="/quizzes" label="Тесты" leftSection={<IconList size={20} />} active={quizzesActive} aria-current={quizzesActive ? 'page' : undefined} h={48} onClick={navigation.close} />
            <NavLink component={Link} to="/attempts" label="Мои попытки" leftSection={<IconHistory size={20} />} active={location.pathname === '/attempts'} aria-current={location.pathname === '/attempts' ? 'page' : undefined} h={48} onClick={navigation.close} />
            <NavLink component={Link} to="/profile" label="Профиль" leftSection={<IconUser size={20} />} active={location.pathname === '/profile'} aria-current={location.pathname === '/profile' ? 'page' : undefined} h={48} onClick={navigation.close} />
            <Divider my="xs" />
            <Button variant="subtle" color="red" justify="flex-start" h={48} leftSection={<IconLogout size={20} />} onClick={logout}>Выйти</Button>
          </Stack>
        </Drawer>
      )}
    </AppShell>
  );
}
