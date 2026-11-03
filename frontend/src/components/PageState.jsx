import { Alert, Button, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { IconAlertCircle, IconInbox } from '@tabler/icons-react';

export function LoadingState({ label = 'Загрузка…' }) {
  return <Center mih={280}><Stack align="center" gap="sm"><Loader /><Text c="dimmed">{label}</Text></Stack></Center>;
}

export function ErrorState({ title = 'Не удалось загрузить данные', message, onRetry }) {
  return (
    <Alert icon={<IconAlertCircle size={20} />} title={title} color="red">
      <Stack gap="sm"><Text size="sm">{message || 'Попробуйте ещё раз.'}</Text>{onRetry && <Button color="red" variant="light" onClick={onRetry} w="fit-content">Повторить</Button>}</Stack>
    </Alert>
  );
}

export function EmptyState({ title, message, children }) {
  return (
    <Center mih={280}>
      <Stack align="center" gap="sm" ta="center">
        <IconInbox size={40} color="var(--mantine-color-gray-6)" />
        <Title order={3}>{title}</Title>
        <Text c="dimmed" maw={420}>{message}</Text>
        {children}
      </Stack>
    </Center>
  );
}
