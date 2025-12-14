import { useState } from 'react';
import type { CreateMemberDto } from '../../services/api';
import './MemberForm.css';

interface MemberFormProps {
  onSubmit: (dto: CreateMemberDto) => Promise<void>;
  onCancel: () => void;
}

export default function MemberForm({ onSubmit, onCancel }: MemberFormProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'admin' | 'reviewer'>('reviewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit({ userId, role });
      setUserId('');
      setRole('reviewer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить участника');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="member-form-container">
      <form onSubmit={handleSubmit} className="member-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="userId">ID пользователя *</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            placeholder="Введите GUID пользователя"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">Роль *</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'reviewer')}
            disabled={loading}
          >
            <option value="reviewer">Ревьюер</option>
            <option value="admin">Администратор</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={loading} className="cancel-button">
            Отмена
          </button>
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Добавление...' : 'Добавить'}
          </button>
        </div>
      </form>
    </div>
  );
}

