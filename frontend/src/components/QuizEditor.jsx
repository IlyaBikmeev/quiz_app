import { ActionIcon, Alert, Anchor, Button, Checkbox, Divider, Group, Paper, Stack, Text, Textarea, TextInput, Title, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';
import { ErrorState, LoadingState } from './PageState';

const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const newOption = (text = '') => ({ id: uid(), text });
const newQuestion = () => ({ id: uid(), text: '', options: [newOption(), newOption()], correctAnswers: [] });

function toQuestion(question) {
  return { id: String(question.id || uid()), text: question.text || '', options: (question.options?.length ? question.options : ['', '']).map(newOption), correctAnswers: Array.isArray(question.correctAnswers) ? [...question.correctAnswers] : [] };
}

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Введите название.';
  values.questions.forEach((question, questionIndex) => {
    if (!question.text.trim()) errors[`questions.${questionIndex}.text`] = 'Введите текст вопроса.';
    if (question.options.filter((option) => option.text.trim()).length < 2) errors[`questions.${questionIndex}.options`] = 'Добавьте минимум два варианта.';
    if (!question.correctAnswers.some((index) => question.options[index]?.text.trim())) errors[`questions.${questionIndex}.correctAnswers`] = 'Отметьте правильный ответ.';
  });
  return errors;
}

export function QuizEditor({ quizId }) {
  const editing = Boolean(quizId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const form = useForm({ mode: 'controlled', initialValues: { title: '', questions: [newQuestion()] }, validate });

  useEffect(() => {
    if (!editing) return undefined;
    let cancelled = false;
    apiJson(`/api/v1/quizzes/${quizId}`)
      .then((data) => {
        if (cancelled) return;
        if (data.canEdit === false) return navigate(`/quizzes/${quizId}`, { replace: true });
        const values = { title: data.title || '', questions: data.questions?.length ? data.questions.map(toQuestion) : [newQuestion()] };
        form.setValues(values);
        form.resetDirty(values);
      })
      .catch(() => !cancelled && setLoadError('Не удалось загрузить квиз.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [editing, quizId, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const warn = (event) => {
      if (!form.isDirty() || saving) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [form, saving]);

  const removeOption = (questionIndex, optionIndex) => {
    const question = form.values.questions[questionIndex];
    form.setFieldValue(`questions.${questionIndex}`, {
      ...question,
      options: question.options.filter((_, index) => index !== optionIndex),
      correctAnswers: question.correctAnswers.filter((index) => index !== optionIndex).map((index) => index > optionIndex ? index - 1 : index),
    });
  };

  const toggleCorrect = (questionIndex, optionIndex) => {
    const current = form.values.questions[questionIndex].correctAnswers;
    form.setFieldValue(`questions.${questionIndex}.correctAnswers`, current.includes(optionIndex) ? current.filter((index) => index !== optionIndex) : [...current, optionIndex]);
  };

  const save = async (values) => {
    setSaving(true);
    setSubmitError('');
    const payload = {
      title: values.title.trim(),
      description: null,
      questions: values.questions.map((question) => {
        const kept = question.options.map((option, index) => option.text.trim() ? index : null).filter((index) => index !== null);
        return { text: question.text.trim(), options: kept.map((index) => question.options[index].text.trim()), correctAnswers: question.correctAnswers.filter((index) => kept.includes(index)).map((index) => kept.indexOf(index)).sort((a, b) => a - b) };
      }),
    };
    try {
      const result = await apiJson(editing ? `/api/v1/quizzes/${quizId}` : '/api/v1/quizzes', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      form.resetDirty();
      notifications.show({ color: 'green', message: editing ? 'Квиз сохранён' : 'Квиз создан' });
      navigate(`/quizzes/${result?.id || quizId}`);
    } catch {
      setSubmitError('Не удалось сохранить квиз. Попробуйте ещё раз.');
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Загрузка редактора…" />;
  if (loadError) return <ErrorState title={loadError} />;

  return (
    <form onSubmit={form.onSubmit(save)}>
      <Stack gap="lg" maw={760} mx="auto">
        <Anchor component={Link} to={editing ? `/quizzes/${quizId}` : '/quizzes'} size="sm">← Отмена</Anchor>
        <Group justify="space-between" align="center"><Title order={1}>{editing ? 'Редактировать квиз' : 'Новый квиз'}</Title><Button type="submit" loading={saving} visibleFrom="sm">{editing ? 'Сохранить' : 'Создать'}</Button></Group>
        <TextInput label="Название" placeholder="Например, История России" required {...form.getInputProps('title')} />

        {form.values.questions.map((question, questionIndex) => (
          <Paper withBorder p="lg" key={question.id}>
            <Stack>
              <Group justify="space-between"><Title order={2} size="h4">Вопрос {questionIndex + 1}</Title>{form.values.questions.length > 1 && <Button type="button" color="red" variant="subtle" size="xs" leftSection={<IconTrash size={14} />} onClick={() => form.removeListItem('questions', questionIndex)}>Удалить</Button>}</Group>
              <Textarea label="Текст вопроса" required autosize minRows={2} {...form.getInputProps(`questions.${questionIndex}.text`)} />
              <Divider label="Варианты ответа" labelPosition="left" />
              <Stack gap="xs">
                {question.options.map((option, optionIndex) => (
                  <Group key={option.id} wrap="nowrap" align="flex-start">
                    <Checkbox mt={8} checked={question.correctAnswers.includes(optionIndex)} onChange={() => toggleCorrect(questionIndex, optionIndex)} aria-label={`Вариант ${optionIndex + 1} правильный`} />
                    <TextInput placeholder={`Вариант ${optionIndex + 1}`} aria-label={`Текст варианта ${optionIndex + 1}`} flex={1} {...form.getInputProps(`questions.${questionIndex}.options.${optionIndex}.text`)} />
                    <Tooltip label={question.options.length <= 2 ? 'Нужно оставить два варианта' : 'Удалить вариант'}>
                      <ActionIcon type="button" mt={4} color="red" variant="subtle" disabled={question.options.length <= 2} onClick={() => removeOption(questionIndex, optionIndex)} aria-label={`Удалить вариант ${optionIndex + 1}`}><IconTrash size={17} /></ActionIcon>
                    </Tooltip>
                  </Group>
                ))}
              </Stack>
              {(form.errors[`questions.${questionIndex}.options`] || form.errors[`questions.${questionIndex}.correctAnswers`]) && <Text c="red" size="sm">{form.errors[`questions.${questionIndex}.options`] || form.errors[`questions.${questionIndex}.correctAnswers`]}</Text>}
              <Button type="button" variant="default" size="xs" leftSection={<IconPlus size={14} />} onClick={() => form.insertListItem(`questions.${questionIndex}.options`, newOption())} w="fit-content">Добавить вариант</Button>
            </Stack>
          </Paper>
        ))}

        <Button type="button" variant="default" leftSection={<IconPlus size={16} />} onClick={() => form.insertListItem('questions', newQuestion())}>Добавить вопрос</Button>
        {submitError && <Alert icon={<IconAlertCircle size={18} />} color="red">{submitError}</Alert>}
        <Group justify="flex-end"><Button component={Link} to={editing ? `/quizzes/${quizId}` : '/quizzes'} variant="default">Отмена</Button><Button type="submit" loading={saving}>{editing ? 'Сохранить квиз' : 'Создать квиз'}</Button></Group>
      </Stack>
    </form>
  );
}
