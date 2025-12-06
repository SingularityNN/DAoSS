import { useState } from 'react';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Для гостя достаточно ввести любое имя пользователя
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Авторизация</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>
          <button type="submit" className="login-button">
            Войти как гость
          </button>
        </form>
        <p className="login-note">
          Вход доступен только в качестве гостя. Панель управления администратора доступна в мобильном приложении.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;



