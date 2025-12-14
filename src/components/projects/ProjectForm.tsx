import { useState, useEffect } from 'react';
import type { Project, ProjectCreateUpdateDto, Language } from '../../services/api';
import { api } from '../../services/api';
import './ProjectForm.css';

interface ProjectFormProps {
  userId: string;
  projectId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProjectForm({ userId, projectId, onSave, onCancel }: ProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [formData, setFormData] = useState<ProjectCreateUpdateDto>({
    name: '',
    description: '',
    ownerId: userId,
    defaultLanguageId: '',
    visibility: 'private',
    requiredReviewersRules: '',
  });

  useEffect(() => {
    loadLanguages();
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadLanguages = async () => {
    try {
      const langs = await api.getLanguages();
      setLanguages(langs);
      // Если языки загружены и defaultLanguageId не установлен, устанавливаем первый язык
      if (langs.length > 0 && !formData.defaultLanguageId) {
        setFormData(prev => ({ ...prev, defaultLanguageId: langs[0].id }));
      }
    } catch (err) {
      console.error('Не удалось загрузить языки:', err);
    }
  };

  const loadProject = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const project = await api.getProject(projectId);
      setFormData({
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        defaultLanguageId: project.defaultLanguageId,
        visibility: project.visibility,
        requiredReviewersRules: project.requiredReviewersRules || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить проект');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const dto: ProjectCreateUpdateDto = {
        ...formData,
        requiredReviewersRules: formData.requiredReviewersRules || undefined,
      };

      if (projectId) {
        await api.updateProject(projectId, dto);
      } else {
        await api.createProject(dto);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить проект');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading && projectId) {
    return <div className="project-form-container">Загрузка...</div>;
  }

  return (
    <div className="project-form-container">
      <h2>{projectId ? 'Редактировать проект' : 'Создать проект'}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-group">
          <label htmlFor="name">Название *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="defaultLanguageId">Язык программирования по умолчанию *</label>
          <select
            id="defaultLanguageId"
            name="defaultLanguageId"
            value={formData.defaultLanguageId}
            onChange={handleChange}
            required
            disabled={loading || languages.length === 0}
          >
            {languages.length === 0 ? (
              <option value="">Загрузка языков...</option>
            ) : (
              languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name} ({lang.code})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="visibility">Видимость</label>
          <select
            id="visibility"
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="private">Приватный</option>
            <option value="public">Публичный</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="requiredReviewersRules">
            Правила ревью (JSON, опционально)
          </label>
          <textarea
            id="requiredReviewersRules"
            name="requiredReviewersRules"
            value={formData.requiredReviewersRules}
            onChange={handleChange}
            rows={3}
            placeholder='[{"Role":"Admin","Count":2}]'
            disabled={loading}
          />
          <small>Формат: JSON массив с правилами ревью</small>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={loading} className="cancel-button">
            Отмена
          </button>
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Сохранение...' : projectId ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}

