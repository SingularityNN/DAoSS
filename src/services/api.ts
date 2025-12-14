import { getToken, removeToken } from '../utils/auth';

const API_BASE_URL = 'http://localhost:5143/api';

interface ApiError {
  message: string;
}

interface LoginResponse {
  token: string;
}

interface RegisterResponse {
  token: string;
}

interface UserInfo {
  sub: string;
  name: string;
  email: string;
}

interface ValidateResponse {
  isValid: boolean;
}

interface ParserRequest {
  code: string;
  language: string;
}

interface ParserResponse {
  success: boolean;
  representation?: any;
  representationType?: string;
  error?: string;
  lexerErrors?: any[];
  parserErrors?: any[];
}

interface ValidationResponse {
  valid: boolean;
  lexerErrors?: any[];
  parserErrors?: any[];
}

interface SimpleValidationResponse {
  valid: boolean;
  hasErrors: boolean;
  lexerErrorsCount: number;
  parserErrorsCount: number;
}

// Projects interfaces
export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  defaultLanguageId: string;
  visibility: string;
  requiredReviewersRules?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  versionHint: string;
  fileExtensions: string;
}

export interface ProjectCreateUpdateDto {
  name: string;
  description: string;
  ownerId: string;
  defaultLanguageId: string;
  visibility?: string;
  requiredReviewersRules?: string;
}

// Project Members interfaces
export interface ProjectMember {
  projectId: string;
  userId: string;
  role: string;
  createdAt?: string;
}

export interface CreateMemberDto {
  userId: string;
  role: 'owner' | 'admin' | 'reviewer';
}

export interface UpdateRoleDto {
  role: 'owner' | 'admin' | 'reviewer';
}

// Invitations interfaces
export interface Invitation {
  id: string;
  projectId: string;
  invitedUserId: string;
  invitedByUserId: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface SendInvitationDto {
  invitedUserId: string;
  role: 'admin' | 'reviewer';
}

// Reviews interfaces
export interface Review {
  id: string;
  projectId: string;
  targetType: 'diagram_version' | 'source_file_version';
  targetId: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewDto {
  targetType: 'diagram_version' | 'source_file_version';
  targetId: string;
}

export interface UpdateReviewDto {
  status: 'approved' | 'changes_requested';
}

export interface ReviewItem {
  id: string;
  reviewId: string;
  kind: 'comment' | 'issue';
  anchorType: 'code' | 'diagram';
  anchorRef: string;
  body: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewItemDto {
  kind: 'comment' | 'issue';
  anchorType: 'code' | 'diagram';
  anchorRef: string;
  body: string;
}

export interface UpdateReviewItemDto {
  body?: string;
  status?: 'open' | 'resolved';
}

export interface Comment {
  id: string;
  reviewItemId: string;
  body: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCommentDto {
  body: string;
}

export interface UpdateCommentDto {
  body: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'Произошла ошибка';

    try {
      const errorData: ApiError = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      if (response.status === 401) {
        errorMessage = 'Неверный логин или пароль';
      } else if (response.status === 500) {
        errorMessage = 'Ошибка сервера, попробуйте позже';
      } else if (response.status === 0 || response.status >= 500) {
        errorMessage = 'Не удалось подключиться к серверу';
      } else {
        errorMessage = `Ошибка ${response.status}`;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  // Нормализуем headers в объект
  const normalizedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Преобразуем options.headers в объект, если это возможно
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        normalizedHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        normalizedHeaders[key] = value;
      });
    } else {
      Object.assign(normalizedHeaders, options.headers);
    }
  }

  if (token) {
    normalizedHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: normalizedHeaders,
    });

    // Если токен невалидный, удаляем его
    if (response.status === 401) {
      removeToken();
      // Вызываем событие для обновления состояния авторизации
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к серверу');
    }
    throw error;
  }
}

async function fetchWithoutAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к серверу');
    }
    throw error;
  }
}

export const api = {
  async login(login: string, password: string): Promise<string> {
    const response = await fetchWithoutAuth<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ Login: login, Password: password }),
    });
    return response.token;
  },

  async register(
    email: string,
    password: string,
    name?: string,
    login?: string
  ): Promise<string> {
    const response = await fetchWithoutAuth<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        Email: email,
        Password: password,
        Name: name,
        Login: login,
      }),
    });
    return response.token;
  },

  async getMe(): Promise<UserInfo> {
    return fetchWithAuth<UserInfo>('/auth/me', {
      method: 'GET',
    });
  },

  async validateToken(): Promise<boolean> {
    try {
      const response = await fetchWithAuth<ValidateResponse>('/auth/validate', {
        method: 'GET',
      });
      return response.isValid;
    } catch {
      return false;
    }
  },

  logout(): void {
    removeToken();
  },

  async parseCode(code: string, language: string): Promise<ParserResponse> {
    return fetchWithAuth<ParserResponse>('/parser/parse', {
      method: 'POST',
      body: JSON.stringify({ Code: code, Language: language }),
    });
  },

  async validateCode(code: string, language: string): Promise<ValidationResponse> {
    return fetchWithAuth<ValidationResponse>('/parser/validate', {
      method: 'POST',
      body: JSON.stringify({ Code: code, Language: language }),
    });
  },

  async validateCodeSimple(code: string, language: string): Promise<SimpleValidationResponse> {
    return fetchWithAuth<SimpleValidationResponse>('/parser/validate/simple', {
      method: 'POST',
      body: JSON.stringify({ Code: code, Language: language }),
    });
  },

  // Languages API
  async getLanguages(): Promise<Language[]> {
    return fetchWithoutAuth<Language[]>('/languages', {
      method: 'GET',
    });
  },

  // Projects API
  async getProjects(ownerId: string): Promise<Project[]> {
    return fetchWithAuth<Project[]>(`/projects?ownerId=${ownerId}`, {
      method: 'GET',
    });
  },

  async getProject(id: string): Promise<Project> {
    return fetchWithAuth<Project>(`/projects/${id}`, {
      method: 'GET',
    });
  },

  async createProject(dto: ProjectCreateUpdateDto): Promise<Project> {
    return fetchWithAuth<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateProject(id: string, dto: ProjectCreateUpdateDto): Promise<void> {
    return fetchWithAuth<void>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteProject(id: string): Promise<void> {
    return fetchWithAuth<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Project Members API
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return fetchWithAuth<ProjectMember[]>(`/projects/${projectId}/members`, {
      method: 'GET',
    });
  },

  async getProjectMember(projectId: string, userId: string): Promise<ProjectMember> {
    return fetchWithAuth<ProjectMember>(`/projects/${projectId}/members/${userId}`, {
      method: 'GET',
    });
  },

  async addProjectMember(projectId: string, dto: CreateMemberDto): Promise<ProjectMember> {
    return fetchWithAuth<ProjectMember>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateMemberRole(projectId: string, userId: string, dto: UpdateRoleDto): Promise<ProjectMember> {
    return fetchWithAuth<ProjectMember>(`/projects/${projectId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    return fetchWithAuth<void>(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  // Invitations API
  async sendInvitation(projectId: string, dto: SendInvitationDto): Promise<Invitation> {
    return fetchWithAuth<Invitation>(`/projects/${projectId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getProjectInvitations(projectId: string, status?: string): Promise<Invitation[]> {
    const url = status
      ? `/projects/${projectId}/invitations?status=${status}`
      : `/projects/${projectId}/invitations`;
    return fetchWithAuth<Invitation[]>(url, {
      method: 'GET',
    });
  },

  async getUserInvitations(): Promise<Invitation[]> {
    return fetchWithAuth<Invitation[]>('/invitations', {
      method: 'GET',
    });
  },

  async getInvitation(invitationId: string): Promise<Invitation> {
    return fetchWithAuth<Invitation>(`/invitations/${invitationId}`, {
      method: 'GET',
    });
  },

  async acceptInvitation(invitationId: string): Promise<Invitation> {
    return fetchWithAuth<Invitation>(`/invitations/${invitationId}/accept`, {
      method: 'POST',
    });
  },

  async rejectInvitation(invitationId: string): Promise<Invitation> {
    return fetchWithAuth<Invitation>(`/invitations/${invitationId}/reject`, {
      method: 'POST',
    });
  },

  async cancelInvitation(projectId: string, invitationId: string): Promise<void> {
    return fetchWithAuth<void>(`/projects/${projectId}/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  },

  // Reviews API
  async createReview(projectId: string, dto: CreateReviewDto): Promise<Review> {
    return fetchWithAuth<Review>(`/projects/${projectId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getReviews(projectId: string): Promise<Review[]> {
    return fetchWithAuth<Review[]>(`/projects/${projectId}/reviews`, {
      method: 'GET',
    });
  },

  async getReview(projectId: string, reviewId: string): Promise<Review> {
    return fetchWithAuth<Review>(`/projects/${projectId}/reviews/${reviewId}`, {
      method: 'GET',
    });
  },

  async updateReview(projectId: string, reviewId: string, dto: UpdateReviewDto): Promise<void> {
    return fetchWithAuth<void>(`/projects/${projectId}/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteReview(projectId: string, reviewId: string): Promise<void> {
    return fetchWithAuth<void>(`/projects/${projectId}/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },

  // Review Items API
  async createReviewItem(projectId: string, reviewId: string, dto: CreateReviewItemDto): Promise<ReviewItem> {
    return fetchWithAuth<ReviewItem>(`/projects/${projectId}/reviews/${reviewId}/items`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getReviewItems(projectId: string, reviewId: string): Promise<ReviewItem[]> {
    return fetchWithAuth<ReviewItem[]>(`/projects/${projectId}/reviews/${reviewId}/items`, {
      method: 'GET',
    });
  },

  async getReviewItem(projectId: string, reviewId: string, itemId: string): Promise<ReviewItem> {
    return fetchWithAuth<ReviewItem>(`/projects/${projectId}/reviews/${reviewId}/items/${itemId}`, {
      method: 'GET',
    });
  },

  async updateReviewItem(projectId: string, reviewId: string, itemId: string, dto: UpdateReviewItemDto): Promise<void> {
    return fetchWithAuth<void>(`/projects/${projectId}/reviews/${reviewId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteReviewItem(projectId: string, reviewId: string, itemId: string): Promise<void> {
    return fetchWithAuth<void>(`/projects/${projectId}/reviews/${reviewId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  // Comments API
  async createComment(projectId: string, reviewId: string, itemId: string, dto: CreateCommentDto): Promise<Comment> {
    return fetchWithAuth<Comment>(`/projects/${projectId}/reviews/${reviewId}/items/${itemId}/comments`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getComments(projectId: string, reviewId: string, itemId: string): Promise<Comment[]> {
    return fetchWithAuth<Comment[]>(`/projects/${projectId}/reviews/${reviewId}/items/${itemId}/comments`, {
      method: 'GET',
    });
  },

  async getComment(projectId: string, reviewId: string, itemId: string, commentId: string): Promise<Comment> {
    return fetchWithAuth<Comment>(`/projects/${projectId}/reviews/${reviewId}/items/${itemId}/comments/${commentId}`, {
      method: 'GET',
    });
  },

  async updateComment(projectId: string, reviewId: string, itemId: string, commentId: string, dto: UpdateCommentDto): Promise<void> {
    return fetchWithAuth<void>(`/projects/${projectId}/reviews/${reviewId}/items/${itemId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteComment(projectId: string, reviewId: string, itemId: string, commentId: string): Promise<void> {
    return fetchWithAuth<void>(`/projects/${projectId}/reviews/${reviewId}/items/${itemId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

