import { Link } from 'react-router-dom';

export function CardSetNewPage() {
  return (
    <div>
      <h1 className="mb-4">Создать набор карточек</h1>
      <div className="d-grid gap-3">
        <Link to="/card-sets/new/manual" className="btn btn-primary btn-lg">Создать вручную</Link>
        <Link to="/card-sets/new/import" className="btn btn-outline-primary btn-lg">Импорт из файла</Link>
      </div>
      <p className="mt-3"><Link to="/card-sets">← К списку наборов</Link></p>
    </div>
  );
}
