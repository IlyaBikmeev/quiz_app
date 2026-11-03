import { Alert, Anchor, Button, PinInput, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function VerifyPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => { if (!email) navigate('/login', { replace: true }); }, [email, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiJson('/auth/verify', { method: 'POST', body: JSON.stringify({ email, otp }) });
      if (!data.token) return setError('Неверный или просроченный код.');
      setToken(data.token);
      navigate('/quizzes', { replace: true });
    } catch {
      setError('Неверный или просроченный код.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;
  return (
    <Paper withBorder p="xl" maw={420} mx="auto">
      <form onSubmit={submit}>
        <Stack align="center">
          <div><Title order={1} size="h2" ta="center">Код из письма</Title><Text c="dimmed" size="sm" ta="center">Отправили на {email}</Text></div>
          <PinInput length={6} value={otp} onChange={setOtp} oneTimeCode inputMode="numeric" aria-label="Код подтверждения" />
          {error && <Alert w="100%" icon={<IconAlertCircle size={18} />} color="red">{error}</Alert>}
          <Button w="100%" type="submit" loading={loading}>Войти</Button>
          <Anchor component={Link} to="/login" size="sm">Запросить новый код</Anchor>
        </Stack>
      </form>
    </Paper>
  );
}
