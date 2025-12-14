import { useState, useEffect } from 'react';
import type { Invitation, SendInvitationDto } from '../../services/api';
import { api } from '../../services/api';
import InvitationForm from './InvitationForm';
import './InvitationsList.css';

interface InvitationsListProps {
  projectId: string;
  canManage: boolean;
}

export default function InvitationsList({ projectId, canManage }: InvitationsListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadInvitations();
  }, [projectId, statusFilter]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjectInvitations(projectId, statusFilter || undefined);
      setInvitations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить приглашения');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (dto: SendInvitationDto) => {
    try {
      await api.sendInvitation(projectId, dto);
      setShowAddForm(false);
      loadInvitations();
    } catch (err) {
      throw err;
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Отменить приглашение?')) {
      return;
    }

    try {
      await api.cancelInvitation(projectId, invitationId);
      loadInvitations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось отменить приглашение');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Ожидает';
      case 'accepted':
        return 'Принято';
      case 'rejected':
        return 'Отклонено';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="invitations-list-container">Загрузка приглашений...</div>;
  }

  if (error) {
    return (
      <div className="invitations-list-container">
        <div className="error">{error}</div>
        <button onClick={loadInvitations}>Повторить</button>
      </div>
    );
  }

  return (
    <div className="invitations-list-container">
      <div className="invitations-header">
        <h2>Приглашения проекта</h2>
        {canManage && (
          <button onClick={() => setShowAddForm(!showAddForm)} className="add-button">
            {showAddForm ? 'Отмена' : '+ Отправить приглашение'}
          </button>
        )}
      </div>

      {canManage && (
        <div className="filter-section">
          <label htmlFor="statusFilter">Фильтр по статусу:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">Все</option>
            <option value="pending">Ожидают</option>
            <option value="accepted">Принятые</option>
            <option value="rejected">Отклоненные</option>
          </select>
        </div>
      )}

      {showAddForm && canManage && (
        <InvitationForm
          onSubmit={handleSendInvitation}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {invitations.length === 0 ? (
        <div className="empty-state">Нет приглашений</div>
      ) : (
        <table className="invitations-table">
          <thead>
            <tr>
              <th>ID приглашенного</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Срок действия</th>
              <th>Создано</th>
              {canManage && <th>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td>{invitation.invitedUserId}</td>
                <td>
                  <span className={`role-badge role-${invitation.role}`}>
                    {invitation.role === 'admin' ? 'Администратор' : 'Ревьюер'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(invitation.status)}`}>
                    {getStatusLabel(invitation.status)}
                  </span>
                </td>
                <td>{formatDate(invitation.expiresAt)}</td>
                <td>{formatDate(invitation.createdAt)}</td>
                {canManage && (
                  <td>
                    {invitation.status === 'pending' && (
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="cancel-button"
                      >
                        Отменить
                      </button>
                    )}
                    {invitation.status !== 'pending' && (
                      <span className="no-actions">-</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

