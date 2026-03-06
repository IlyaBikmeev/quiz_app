import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="p-4 p-md-5 bg-primary text-white rounded-3">
      <h1 className="display-4 fs-2 fs-md-4">Эффективное обучение с QuizForge!</h1>
      <p className="lead">Идеальный инструмент для подготовки к экзаменам: создавай квизы, повторяй материал и отслеживай свой прогресс.</p>
      <hr className="my-4" />
      <p>Наше приложение разработано специально для студентов, которые хотят быстро и эффективно запомнить учебный материал.</p>
      <Link className="btn btn-light btn-lg" to="/quizzes">Начать обучение</Link>
    </div>
  );
}
