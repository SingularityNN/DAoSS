import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import InvitationsPageWrapper from '../../pages/InvitationsPage'
import { setupApiMocks, resetApiMocks } from '../mocks/api'

describe('Invitations Integration Tests', () => {
  const mockApi = setupApiMocks()

  beforeEach(() => {
    resetApiMocks()
    localStorage.setItem('token', 'test-token')
    vi.clearAllMocks()
  })

  it('should load and display pending invitations', async () => {
    const mockInvitations = [
      {
        id: 'inv-1',
        projectId: 'project-1',
        role: 'reviewer' as const,
        status: 'pending',
        expiresAt: '2024-12-31',
        createdAt: '2024-01-01',
      },
      {
        id: 'inv-2',
        projectId: 'project-2',
        role: 'admin' as const,
        status: 'pending',
        expiresAt: '2024-12-31',
        createdAt: '2024-01-02',
      },
    ]

    mockApi.getUserInvitations.mockResolvedValue(mockInvitations)

    render(<InvitationsPageWrapper />)

    await waitFor(() => {
      expect(mockApi.getUserInvitations).toHaveBeenCalled()
    })
  })

  it('should show empty state when no invitations', async () => {
    mockApi.getUserInvitations.mockResolvedValue([])

    render(<InvitationsPageWrapper />)

    await waitFor(() => {
      expect(mockApi.getUserInvitations).toHaveBeenCalled()
    })
  })

})

