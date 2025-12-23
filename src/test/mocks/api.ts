import { vi } from 'vitest'

const createMockApi = () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
  validateToken: vi.fn(),
  logout: vi.fn(),
  getProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getUserInvitations: vi.fn(),
  getProjectInvitations: vi.fn(),
  sendInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
  rejectInvitation: vi.fn(),
  cancelInvitation: vi.fn(),
  getProjectMembers: vi.fn(),
  addProjectMember: vi.fn(),
  updateMemberRole: vi.fn(),
  removeProjectMember: vi.fn(),
  getReviews: vi.fn(),
  getReview: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
  getSourceFiles: vi.fn(),
  getSourceFile: vi.fn(),
  createSourceFile: vi.fn(),
  deleteSourceFile: vi.fn(),
  getSourceFileVersions: vi.fn(),
  getSourceFileVersion: vi.fn(),
  createSourceFileVersion: vi.fn(),
  parseCode: vi.fn(),
  validateCode: vi.fn(),
  validateCodeSimple: vi.fn(),
})

export const mockApi = createMockApi()

// Мокируем API до импорта компонентов
vi.mock('../../services/api', () => {
  return {
    api: mockApi,
  }
})

export function setupApiMocks() {
  return mockApi
}

export function resetApiMocks() {
  Object.values(mockApi).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockReset()
    }
  })
  
  // Устанавливаем значения по умолчанию для критичных методов
  mockApi.validateToken.mockResolvedValue(false)
  mockApi.getMe.mockResolvedValue({
    sub: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  })
}

