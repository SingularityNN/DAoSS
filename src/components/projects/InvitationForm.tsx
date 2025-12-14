import { useState } from 'react';
import type { SendInvitationDto } from '../../services/api';
import './InvitationForm.css';

interface InvitationFormProps {
  onSubmit: (dto: SendInvitationDto) => Promise<void>;
  onCancel: () => void;
}

export default function InvitationForm({ onSubmit, onCancel }: InvitationFormProps) {
  const [invitedUserId, setInvitedUserId] = useState('');
  const [role, setRole] = useState<'admin' | 'reviewer'>('reviewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit({ invitedUserId, role });
      setInvitedUserId('');
      setRole('reviewer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить приглашение');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invitation-form-container">
      <form onSubmit={handleSubmit} className="invitation-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="invitedUserId">ID приглашаемого пользователя *</label>
          <input
            type="text"
            id="invitedUserId"
            value={invitedUserId}
            onChange={(e) => setInvitedUserId(e.target.value)}
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
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </form>
    </div>
  );
}

