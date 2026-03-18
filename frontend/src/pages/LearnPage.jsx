import { Link, useParams } from 'react-router-dom';

export function LearnPage() {
  const { id } = useParams();
  return (
    <div>
      <nav className="mb-3"><Link to={`/card-sets/${id}`}>← К набору</Link></nav>
      <h1>Режим заучивания</h1>
      <p className="text-muted">Страница в разработке</p>
    </div>
  );
}
