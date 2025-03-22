-- Добавляем тестового пользователя
INSERT INTO users (id, email, name)
VALUES (228, 'test@example.com', 'Тестовый Пользователь');

-- Вставляем квизы
INSERT INTO quizzes (id, title, creator_id)
VALUES (1111, 'Java Basics', 228);
INSERT INTO quizzes (id, title, creator_id)
VALUES (2222, 'Spring Boot', 228);

-- Вставляем вопросы
INSERT INTO questions (id, text, quiz_id)
VALUES (1111, 'Что такое JVM?', 1111);
INSERT INTO questions (id, text, quiz_id)
VALUES (2222, 'Что делает JIT-компилятор?', 1111);
INSERT INTO questions (id, text, quiz_id)
VALUES (3333, 'Что такое Dependency Injection?', 2222);
INSERT INTO questions (id, text, quiz_id)
VALUES (4444, 'Какой аннотацией помечается Spring Bean?', 2222);

-- Вставляем варианты ответов (ElementCollection создаёт отдельную таблицу)
INSERT INTO question_options (question_id, options)
VALUES (1111, 'Виртуальная машина Java');
INSERT INTO question_options (question_id, options)
VALUES (1111, 'База данных');
INSERT INTO question_options (question_id, options)
VALUES (1111, 'Среда разработки');

INSERT INTO question_options (question_id, options)
VALUES (2222, 'Оптимизирует байт-код');
INSERT INTO question_options (question_id, options)
VALUES (2222, 'Компилирует Java в C++');
INSERT INTO question_options (question_id, options)
VALUES (2222, 'Запускает сборщик мусора');

INSERT INTO question_options (question_id, options)
VALUES (3333, 'Принцип внедрения зависимостей');
INSERT INTO question_options (question_id, options)
VALUES (3333, 'Метод тестирования');
INSERT INTO question_options (question_id, options)
VALUES (3333, 'Алгоритм сортировки');

INSERT INTO question_options (question_id, options)
VALUES (4444, '@Component');
INSERT INTO question_options (question_id, options)
VALUES (4444, '@Autowired');
INSERT INTO question_options (question_id, options)
VALUES (4444, '@Service');

-- Вставляем правильные ответы (индексы вариантов)
INSERT INTO question_correct_answers (question_id, correct_answers)
VALUES (1111, 0);
INSERT INTO question_correct_answers (question_id, correct_answers)
VALUES (2222, 0);
INSERT INTO question_correct_answers (question_id, correct_answers)
VALUES (3333, 0);
INSERT INTO question_correct_answers (question_id, correct_answers)
VALUES (4444, 0);
