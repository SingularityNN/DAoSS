import { useState, useEffect } from 'react';
import type { ProjectMember, CreateMemberDto, UpdateRoleDto } from '../../services/api';
import { api } from '../../services/api';
import MemberForm from './MemberForm';
import './MembersList.css';

interface MembersListProps {
  projectId: string;
  userId: string;
  userRole: string | null;
  onUpdate: () => void;
}

export default function MembersList({ projectId, userId, userRole, onUpdate }: MembersListProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const canManage = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjectMembers(projectId);
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить участников');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (dto: CreateMemberDto) => {
    try {
      await api.addProjectMember(projectId, dto);
      setShowAddForm(false);
      loadMembers();
      onUpdate();
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateRole = async (memberUserId: string, newRole: 'owner' | 'admin' | 'reviewer') => {
    if (!confirm(`Изменить роль на "${newRole}"?`)) {
      return;
    }

    try {
      const dto: UpdateRoleDto = { role: newRole };
      await api.updateMemberRole(projectId, memberUserId, dto);
      loadMembers();
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось изменить роль');
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm('Удалить участника из проекта?')) {
      return;
    }

    try {
      await api.removeProjectMember(projectId, memberUserId);
      loadMembers();
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось удалить участника');
    }
  };

  if (loading) {
    return <div className="members-list-container">Загрузка участников...</div>;
  }

  if (error) {
    return (
      <div className="members-list-container">
        <div className="error">{error}</div>
        <button onClick={loadMembers}>Повторить</button>
      </div>
    );
  }

  return (
    <div className="members-list-container">
      <div className="members-header">
        <h2>Участники проекта</h2>
        {canManage && (
          <button onClick={() => setShowAddForm(!showAddForm)} className="add-button">
            {showAddForm ? 'Отмена' : '+ Добавить участника'}
          </button>
        )}
      </div>

      {showAddForm && canManage && (
        <MemberForm
          onSubmit={handleAddMember}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {members.length === 0 ? (
        <div className="empty-state">Нет участников</div>
      ) : (
        <table className="members-table">
          <thead>
            <tr>
              <th>ID пользователя</th>
              <th>Роль</th>
              {canManage && <th>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId}>
                <td>{member.userId}</td>
                <td>
                  <span className={`role-badge role-${member.role}`}>
                    {member.role === 'owner' ? 'Владелец' :
                      member.role === 'admin' ? 'Администратор' : 'Ревьюер'}
                  </span>
                </td>
                {canManage && (
                  <td className="actions-cell">
                    {member.role !== 'owner' && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.userId, e.target.value as any)}
                          className="role-select"
                        >
                          <option value="reviewer">Ревьюер</option>
                          <option value="admin">Администратор</option>
                          {userRole === 'owner' && <option value="owner">Владелец</option>}
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="remove-button"
                        >
                          Удалить
                        </button>
                      </>
                    )}
                    {member.role === 'owner' && <span className="no-actions">Нельзя изменить</span>}
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

