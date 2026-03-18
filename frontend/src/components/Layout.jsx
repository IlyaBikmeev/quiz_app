import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { valid, validUnknown, setToken } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <div className="min-vh-100 w-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">QuizForge</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item"><Link className="nav-link" to="/">Главная</Link></li>
              {valid && (
                <>
                  <li className="nav-item"><Link className="nav-link" to="/quizzes">Квизы</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/quizzes/new">Создать квиз</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/card-sets">Наборы карточек</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/card-sets/new">Создать набор</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/profile">Профиль</Link></li>
                </>
              )}
            </ul>
            <ul className="navbar-nav">
              {validUnknown ? (
                <li className="nav-item"><span className="nav-link text-white-50">Проверка...</span></li>
              ) : valid ? (
                <li className="nav-item">
                  <button type="button" className="btn btn-outline-light btn-sm" onClick={handleLogout}>Выйти</button>
                </li>
              ) : (
                <>
                  <li className="nav-item"><Link className="nav-link" to="/login">Вход</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/register">Регистрация</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
      <main className="container flex-grow-1 py-4">
        <Outlet />
      </main>
      <footer className="bg-light py-3 mt-auto">
        <div className="container text-center text-muted small">QuizForge — подготовка к экзаменам</div>
      </footer>
    </div>
  );
}
