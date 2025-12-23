import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import ProjectsListPage from '../../pages/ProjectsListPage'
import ProjectCreatePage from '../../pages/ProjectCreatePage'
import { setupApiMocks, resetApiMocks } from '../mocks/api'

describe('Projects Integration Tests', () => {
  const mockApi = setupApiMocks()

  beforeEach(() => {
    resetApiMocks()
    localStorage.clear()
    localStorage.setItem('token', 'test-token')
    vi.clearAllMocks()
  })

  describe('Projects List', () => {
    it('should load and display projects', async () => {
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      })

      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          description: 'Description 1',
          visibility: 'private',
          createdAt: '2024-01-01',
          ownerId: 'user-123',
        },
        {
          id: 'project-2',
          name: 'Project 2',
          description: 'Description 2',
          visibility: 'public',
          createdAt: '2024-01-02',
          ownerId: 'user-123',
        },
      ]

      mockApi.getProjects.mockResolvedValue(mockProjects)

      render(<ProjectsListPage />)

      await waitFor(() => {
        expect(mockApi.getMe).toHaveBeenCalled()
        expect(mockApi.getProjects).toHaveBeenCalledWith('user-123')
      })

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
        expect(screen.getByText('Project 2')).toBeInTheDocument()
      })
    })

    it('should show empty state when no projects', async () => {
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      })
      mockApi.getProjects.mockResolvedValue([])

      render(<ProjectsListPage />)

      await waitFor(() => {
        expect(mockApi.getProjects).toHaveBeenCalled()
      })
    })

    it('should handle project click navigation', async () => {
      const user = userEvent.setup()
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      })

      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Description',
          visibility: 'private',
          createdAt: '2024-01-01',
          ownerId: 'user-123',
        },
      ]

      mockApi.getProjects.mockResolvedValue(mockProjects)

      render(<ProjectsListPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument()
      })

      const projectCard = screen.getByText('Test Project')
      await user.click(projectCard)

      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects/project-1')
      })
    })
  })

  describe('Project Creation', () => {
    it('should load user info and show form', async () => {
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      })

      render(<ProjectCreatePage />)

      await waitFor(() => {
        expect(mockApi.getMe).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByLabelText(/название проекта/i)).toBeInTheDocument()
      })
    })

    it('should cancel project creation', async () => {
      const user = userEvent.setup()
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      })

      render(<ProjectCreatePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/название проекта/i)).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects')
      })
    })
  })
})


