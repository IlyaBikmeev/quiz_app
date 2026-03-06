import { Link } from 'react-router-dom';

export function QuizNewPage() {
  return (
    <div>
      <h1 className="mb-4">Создать квиз</h1>
      <div className="d-grid gap-3">
        <Link to="/quizzes/new/manual" className="btn btn-primary btn-lg">Создать вручную</Link>
        <Link to="/quizzes/new/import" className="btn btn-outline-primary btn-lg">Импорт из файла</Link>
      </div>
      <p className="mt-3"><Link to="/quizzes">← К списку квизов</Link></p>
    </div>
  );
}
