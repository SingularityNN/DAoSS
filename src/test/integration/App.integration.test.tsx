import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import App from '../../App'
import { setupApiMocks, resetApiMocks } from '../mocks/api'

describe('App Integration Tests', () => {
  const mockApi = setupApiMocks()

  beforeEach(() => {
    resetApiMocks()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Authentication Flow', () => {
    it('should show login page for unauthenticated user', async () => {
      mockApi.validateToken.mockResolvedValue(false)

      render(<App />, { withRouter: false })

      await waitFor(() => {
        expect(screen.getByText(/войти/i)).toBeInTheDocument()
      })
    })

    it('should handle successful registration', async () => {
      const user = userEvent.setup()
      
      mockApi.validateToken.mockResolvedValue(false)
      mockApi.register.mockResolvedValue('new-token')
      mockApi.getMe.mockResolvedValue({
        sub: 'user-123',
        name: 'New User',
        email: 'new@example.com',
      })
      mockApi.getProjects.mockResolvedValue([])

      render(<App />, { withRouter: false })

      const registerLink = screen.getByText(/зарегистрироваться/i)
      await user.click(registerLink)

      await waitFor(() => {
        expect(screen.getByText(/регистрация/i)).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/пароль/i)
      const nameInput = screen.getByLabelText(/имя/i)
      const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i })

      await user.type(emailInput, 'new@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(nameInput, 'New User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockApi.register).toHaveBeenCalled()
        expect(window.location.pathname).toBe('/projects')
      })
    })
  })

})

