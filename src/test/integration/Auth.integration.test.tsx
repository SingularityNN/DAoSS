import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import LoginPage from '../../components/LoginPage'
import { setupApiMocks, resetApiMocks } from '../mocks/api'

describe('Authentication Integration Tests', () => {
  const mockApi = setupApiMocks()

  beforeEach(() => {
    resetApiMocks()
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should switch between login and register modes', async () => {
    const user = userEvent.setup()
    mockApi.validateToken.mockResolvedValue(false)

    const mockOnLogin = vi.fn()

    render(<LoginPage onLogin={mockOnLogin} />)

    expect(screen.getByText(/войти/i)).toBeInTheDocument()

    const switchToRegister = screen.getByText(/зарегистрироваться/i)
    await user.click(switchToRegister)

    await waitFor(() => {
      expect(screen.getByText(/регистрация/i)).toBeInTheDocument()
    })
  })

  it('should validate login form fields', async () => {
    const user = userEvent.setup()
    const mockOnLogin = vi.fn()

    render(<LoginPage onLogin={mockOnLogin} />)

    const submitButton = screen.getByRole('button', { name: /войти/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockApi.login).not.toHaveBeenCalled()
    })
  })

  it('should handle network error during login', async () => {
    const user = userEvent.setup()
    mockApi.login.mockRejectedValue(new Error('Network error'))

    const mockOnLogin = vi.fn()

    render(<LoginPage onLogin={mockOnLogin} />)

    const usernameInput = screen.getByLabelText(/имя пользователя или email/i)
    const passwordInput = screen.getByLabelText(/пароль/i)
    const submitButton = screen.getByRole('button', { name: /войти/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it('should handle registration with all fields', async () => {
    const user = userEvent.setup()
    mockApi.register.mockResolvedValue('token')
    mockApi.getMe.mockResolvedValue({
      sub: 'user-123',
      name: 'New User',
      email: 'new@example.com',
    })

    const mockOnLogin = vi.fn()

    render(<LoginPage onLogin={mockOnLogin} />)

    const switchToRegister = screen.getByText(/зарегистрироваться/i)
    await user.click(switchToRegister)

    await waitFor(() => {
      expect(screen.getByText(/регистрация/i)).toBeInTheDocument()
    })

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

    await waitFor(() => {
      expect(mockApi.register).toHaveBeenCalledWith(
        'new@example.com',
        'password123',
        'New User',
        'newuser'
      )
    })
  })

})

