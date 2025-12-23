import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import App from '../../App'
import { setupApiMocks, resetApiMocks } from '../mocks/api'

describe('End-to-End Tests', () => {
  const mockApi = setupApiMocks()

  beforeEach(() => {
    resetApiMocks()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Complete User Journey: Registration to Project Creation', () => {
    it('should complete full flow: register -> create project -> view project', async () => {
      const user = userEvent.setup()
      
      // Setup: User is not authenticated
      mockApi.validateToken.mockResolvedValue(false)

      // Step 1: Start at home page
      render(<App />, { withRouter: false })
      
      await waitFor(() => {
        expect(screen.getByText(/войти/i)).toBeInTheDocument()
      })

      // Step 2: Navigate to registration
      const registerLink = screen.getByText(/зарегистрироваться/i)
      await user.click(registerLink)

      await waitFor(() => {
        expect(screen.getByText(/регистрация/i)).toBeInTheDocument()
      })

      // Step 3: Register new user
      mockApi.register.mockResolvedValue('new-token')
      mockApi.validateToken.mockResolvedValue(true)
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'New User',
        email: 'new@example.com',
      })
      mockApi.getProjects.mockResolvedValue([])

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/пароль/i)
      const nameInput = screen.getByLabelText(/имя/i)
      const loginInput = screen.getByLabelText(/логин/i)
      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i })

      await user.type(emailInput, 'new@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(nameInput, 'New User')
      await user.type(loginInput, 'newuser')
      await user.click(submitButton)

      // Step 4: Should be redirected to projects page
      await waitFor(() => {
        expect(mockApi.register).toHaveBeenCalled()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects')
      }, { timeout: 3000 })

      // Step 5: Wait for projects page to load and find create button
      await waitFor(() => {
        expect(screen.getByText(/создать проект/i)).toBeInTheDocument()
      }, { timeout: 3000 })

      const createProjectButton = screen.getByText(/создать проект/i)
      await user.click(createProjectButton)

      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects/new')
        expect(screen.getByLabelText(/название проекта/i)).toBeInTheDocument()
      })

      // Step 6: Create a new project
      const mockProject = {
        id: 'project-new',
        name: 'My New Project',
        description: 'Test Description',
        visibility: 'private',
        createdAt: '2024-01-01',
        ownerId: 'user-123',
      }

      mockApi.createProject.mockResolvedValue(mockProject)
      mockApi.getProjects.mockResolvedValue([mockProject])

      const projectNameInput = screen.getByLabelText(/название проекта/i)
      const projectDescriptionInput = screen.getByLabelText(/описание/i)
      const createButton = screen.getByRole('button', { name: /создать/i })

      await user.type(projectNameInput, 'My New Project')
      await user.type(projectDescriptionInput, 'Test Description')
      await user.click(createButton)

      // Step 7: Should be redirected back to projects list with new project
      await waitFor(() => {
        expect(mockApi.createProject).toHaveBeenCalled()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects')
      }, { timeout: 3000 })
    })
  })

  describe('Complete User Journey: Login to Project Interaction', () => {
    it('should complete flow: login -> view projects -> open project', async () => {
      const user = userEvent.setup()
      
      // Setup: User is not authenticated
      mockApi.validateToken.mockResolvedValue(false)

      render(<App />, { withRouter: false })

      // Step 1: Navigate to login page
      const loginLink = screen.getByText(/войти/i)
      await user.click(loginLink)

      await waitFor(() => {
        expect(screen.getByText(/войти/i)).toBeInTheDocument()
      })

      // Step 2: Login
      mockApi.login.mockResolvedValue('test-token')
      mockApi.validateToken.mockResolvedValue(true)
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      })

      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test Description',
          visibility: 'private',
          createdAt: '2024-01-01',
          ownerId: 'user-123',
        },
      ]

      mockApi.getProjects.mockResolvedValue(mockProjects)

      const usernameInput = screen.getByLabelText(/имя пользователя или email/i)
      const passwordInput = screen.getByLabelText(/пароль/i)
      const loginButton = screen.getByRole('button', { name: /войти/i })

      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'password123')
      await user.click(loginButton)

      // Step 3: Should be redirected to projects page
      await waitFor(() => {
        expect(mockApi.login).toHaveBeenCalled()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects')
      }, { timeout: 3000 })

      // Step 4: Wait for projects to load
      await waitFor(() => {
        expect(mockApi.getProjects).toHaveBeenCalled()
        expect(screen.getByText('Test Project')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Step 5: Click on project to open it
      const projectCard = screen.getByText('Test Project')
      await user.click(projectCard)

      // Step 6: Should navigate to project details
      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects/project-1')
      }, { timeout: 3000 })
    })
  })

  describe('Complete User Journey: Project Creation to Navigation', () => {
    it('should complete flow: login -> create project -> cancel -> return to list', async () => {
      const user = userEvent.setup()
      
      // Setup: Start from login
      mockApi.validateToken.mockResolvedValue(false)

      render(<App />, { withRouter: false })

      // Step 1: Navigate to login
      const loginLink = screen.getByText(/войти/i)
      await user.click(loginLink)

      await waitFor(() => {
        expect(screen.getByText(/войти/i)).toBeInTheDocument()
      })

      // Step 2: Login
      mockApi.login.mockResolvedValue('test-token')
      mockApi.validateToken.mockResolvedValue(true)
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      })
      mockApi.getProjects.mockResolvedValue([])

      const usernameInput = screen.getByLabelText(/имя пользователя или email/i)
      const passwordInput = screen.getByLabelText(/пароль/i)
      const loginButton = screen.getByRole('button', { name: /войти/i })

      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'password123')
      await user.click(loginButton)

      // Step 3: Wait for projects page
      await waitFor(() => {
        expect(mockApi.login).toHaveBeenCalled()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects')
      }, { timeout: 3000 })

      // Step 4: Wait for create button to appear
      await waitFor(() => {
        expect(screen.getByText(/создать проект/i)).toBeInTheDocument()
      }, { timeout: 3000 })

      const createProjectButton = screen.getByText(/создать проект/i)
      await user.click(createProjectButton)

      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects/new')
        expect(screen.getByLabelText(/название проекта/i)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Step 5: Fill form partially
      const projectNameInput = screen.getByLabelText(/название проекта/i)
      await user.type(projectNameInput, 'Partial Project')

      // Step 6: Cancel creation
      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      await user.click(cancelButton)

      // Step 7: Should return to projects list
      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects')
        expect(mockApi.createProject).not.toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('Complete User Journey: Authentication State Management', () => {
    it('should handle logout flow: login -> profile -> logout -> redirect to home', async () => {
      const user = userEvent.setup()
      
      // Setup: Start from login
      mockApi.validateToken.mockResolvedValue(false)

      render(<App />, { withRouter: false })

      // Step 1: Navigate to login
      const loginLink = screen.getByText(/войти/i)
      await user.click(loginLink)

      await waitFor(() => {
        expect(screen.getByText(/войти/i)).toBeInTheDocument()
      })

      // Step 2: Login
      mockApi.login.mockResolvedValue('test-token')
      mockApi.validateToken.mockResolvedValue(true)
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      })
      mockApi.getProjects.mockResolvedValue([])

      const usernameInput = screen.getByLabelText(/имя пользователя или email/i)
      const passwordInput = screen.getByLabelText(/пароль/i)
      const loginButton = screen.getByRole('button', { name: /войти/i })

      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'password123')
      await user.click(loginButton)

      // Step 3: Wait for projects page
      await waitFor(() => {
        expect(mockApi.login).toHaveBeenCalled()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects')
      }, { timeout: 3000 })

      // Step 4: Navigate to profile page
      const profileLink = screen.getByText(/личный кабинет/i)
      await user.click(profileLink)

      await waitFor(() => {
        expect(window.location.pathname).toBe('/profile')
      }, { timeout: 3000 })

      // Step 5: Find and click logout button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /выйти/i })).toBeInTheDocument()
      }, { timeout: 3000 })

      const logoutButton = screen.getByRole('button', { name: /выйти/i })
      await user.click(logoutButton)

      // Step 6: Should be redirected to home page
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull()
        expect(window.location.pathname).toBe('/')
      }, { timeout: 3000 })

      // Step 7: Should show home page with login link
      await waitFor(() => {
        expect(screen.getByText(/войти/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Complete User Journey: Invitation Flow', () => {
    it('should complete flow: login -> view invitations', async () => {
      const user = userEvent.setup()
      
      // Setup: Start from login
      mockApi.validateToken.mockResolvedValue(false)

      render(<App />, { withRouter: false })

      // Step 1: Navigate to login
      const loginLink = screen.getByText(/войти/i)
      await user.click(loginLink)

      await waitFor(() => {
        expect(screen.getByText(/войти/i)).toBeInTheDocument()
      })

      // Step 2: Login
      mockApi.login.mockResolvedValue('test-token')
      mockApi.validateToken.mockResolvedValue(true)
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      })
      mockApi.getProjects.mockResolvedValue([])

      const mockInvitations = [
        {
          id: 'inv-1',
          projectId: 'project-1',
          projectName: 'Invited Project',
          inviterName: 'Owner User',
          status: 'pending',
        },
      ]

      mockApi.getUserInvitations.mockResolvedValue(mockInvitations)

      const usernameInput = screen.getByLabelText(/имя пользователя или email/i)
      const passwordInput = screen.getByLabelText(/пароль/i)
      const loginButton = screen.getByRole('button', { name: /войти/i })

      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'password123')
      await user.click(loginButton)

      // Step 3: Wait for projects page
      await waitFor(() => {
        expect(mockApi.login).toHaveBeenCalled()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(window.location.pathname).toBe('/projects')
      }, { timeout: 3000 })

      // Step 4: Navigate to invitations via navigation link
      const invitationsLink = screen.getByText(/приглашения/i)
      await user.click(invitationsLink)

      await waitFor(() => {
        expect(window.location.pathname).toBe('/invitations')
      }, { timeout: 3000 })
      
      // Step 5: Wait for invitations to load
      await waitFor(() => {
        expect(mockApi.getUserInvitations).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })
})

