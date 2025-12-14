import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-title">DAoSS - Система управления проектами</h1>
        <p className="home-description">
          Платформа для совместной работы над проектами, управления ревью и приглашениями.
          Создавайте проекты, приглашайте участников и отслеживайте прогресс.
        </p>

        <div className="home-features">
          <div className="feature-card">
            <h3>Управление проектами</h3>
            <p>Создавайте и управляйте проектами с различными уровнями доступа</p>
          </div>
          <div className="feature-card">
            <h3>Система ревью</h3>
            <p>Организуйте процесс ревью кода с настраиваемыми правилами</p>
          </div>
          <div className="feature-card">
            <h3>Приглашения</h3>
            <p>Приглашайте участников в проекты и управляйте их правами</p>
          </div>
        </div>

        <div className="home-actions">
          <Link to="/login" className="home-button primary">
            Войти
          </Link>
          <Link to="/login?mode=register" className="home-button secondary">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}

