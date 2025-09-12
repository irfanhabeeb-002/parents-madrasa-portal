import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { SimpleLoginForm } from '../../components/auth/SimpleLoginForm'
import { Dashboard } from '../../pages/Dashboard'

// Mock services
vi.mock('../../services/dashboardService', () => ({
  DashboardService: {
    getDashboardData: vi.fn().mockResolvedValue({
      success: true,
      data: {
        user: { id: '1', name: 'Test User', role: 'student', lastLoginAt: new Date() },
        stats: {
          totalClasses: 10,
          attendedClasses: 8,
          attendancePercentage: 80,
          totalRecordings: 5,
          totalNotes: 12,
          totalExercises: 6,
          completedExercises: 4,
          averageScore: 85,
          upcomingClasses: 2,
          unreadNotifications: 3
        },
        todaysClasses: [],
        recentRecordings: [],
        recentNotes: [],
        upcomingExercises: [],
        announcements: [
          {
            id: 'ann-1',
            title: 'Welcome Message',
            message: 'Welcome to the portal',
            malayalamMessage: 'പോർട്ടലിലേക്ക് സ്വാഗതം',
            type: 'general',
            priority: 'high',
            createdAt: new Date(),
            isActive: true,
            targetAudience: 'all'
          }
        ],
        notifications: []
      },
      timestamp: new Date()
    }),
    getAnnouncements: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date()
    }),
    subscribeToAnnouncements: vi.fn().mockReturnValue(() => {}),
    subscribeToUserNotifications: vi.fn().mockReturnValue(() => {}),
    subscribeToTodaysClasses: vi.fn().mockReturnValue(() => {})
  }
}))

// Mock auth context
const mockLoginWithPhone = vi.fn()
const mockLogout = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
    loginWithPhone: mockLoginWithPhone,
    logout: mockLogout,
    clearError: vi.fn()
  })
}))

// Mock other contexts
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    notifications: [],
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    clearNotifications: vi.fn()
  })
}))

vi.mock('../../contexts/FontSizeContext', () => ({
  useFontSize: () => ({
    fontSize: 'medium',
    setFontSize: vi.fn()
  })
}))

vi.mock('../../contexts/AccessibilityContext', () => ({
  useAccessibility: () => ({
    highContrast: false,
    reducedMotion: false,
    setHighContrast: vi.fn(),
    setReducedMotion: vi.fn()
  })
}))

// Mock router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' })
  }
})

describe('User Workflows Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication Flow', () => {
    it('should complete login workflow successfully', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      
      mockLoginWithPhone.mockResolvedValue(undefined)
      
      render(
        <BrowserRouter>
          <SimpleLoginForm onSuccess={mockOnSuccess} />
        </BrowserRouter>
      )
      
      // User sees login form
      expect(screen.getByText('Login')).toBeInTheDocument()
      // Note: Malayalam UI text removed - Malayalam should only be in educational content
      expect(screen.getByText('Demo Users:')).toBeInTheDocument()
      
      // User enters phone number
      const phoneInput = screen.getByRole('textbox')
      await user.type(phoneInput, '9876543210')
      
      // User submits form
      const submitButton = screen.getByRole('button', { name: /login with phone number/i })
      await user.click(submitButton)
      
      // Verify login was called with correct data
      expect(mockLoginWithPhone).toHaveBeenCalledWith('9876543210')
      
      // Verify success callback was called
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should handle login validation errors', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <SimpleLoginForm />
        </BrowserRouter>
      )
      
      const submitButton = screen.getByRole('button', { name: /login with phone number/i })
      
      // Try to submit without phone number
      await user.click(submitButton)
      expect(screen.getByText('Phone number is required')).toBeInTheDocument()
      
      // Enter invalid phone number
      const phoneInput = screen.getByRole('textbox')
      await user.type(phoneInput, '123')
      await user.click(submitButton)
      expect(screen.getByText('Please enter a valid 10-digit Indian mobile number')).toBeInTheDocument()
      
      // Enter valid phone number - error should clear
      await user.clear(phoneInput)
      await user.type(phoneInput, '9876543210')
      await user.click(submitButton)
      expect(screen.queryByText('Please enter a valid 10-digit Indian mobile number')).not.toBeInTheDocument()
    })
  })

  describe('Dashboard Workflow', () => {
    it('should load and display dashboard data', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      )
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
      
      // Check if main navigation cards are present
      expect(screen.getByText('Live Class')).toBeInTheDocument()
      expect(screen.getByText('Recordings')).toBeInTheDocument()
      expect(screen.getByText('Notes/Exercises')).toBeInTheDocument()
      expect(screen.getByText('Exams/Attendance')).toBeInTheDocument()
      
      // Note: Malayalam UI subtitles removed - Malayalam should only be in educational content
      
      // Check announcements
      expect(screen.getByText('Welcome Message')).toBeInTheDocument()
      // Note: Malayalam content in announcements is educational content, so it's preserved
      expect(screen.getByText('പോർട്ടലിലേക്ക് സ്വാഗതം')).toBeInTheDocument()
    })

    it('should handle dashboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
      
      // Test card interactions
      const liveClassCard = screen.getByText('Live Class').closest('button')
      expect(liveClassCard).toBeInTheDocument()
      expect(liveClassCard).toHaveClass('cursor-pointer')
      
      // Test keyboard navigation
      if (liveClassCard) {
        liveClassCard.focus()
        expect(liveClassCard).toHaveFocus()
      }
    })
  })

  describe('Accessibility Workflow', () => {
    it('should support keyboard navigation throughout the app', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <SimpleLoginForm />
        </BrowserRouter>
      )
      
      // Tab through form elements
      await user.tab()
      expect(screen.getByRole('textbox')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /login with phone number/i })).toHaveFocus()
    })

    it('should provide proper ARIA labels and roles', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
      
      // Check for proper roles
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Check for proper headings
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling Workflow', () => {
    it('should handle service errors gracefully', async () => {
      // Mock service to return error
      const { DashboardService } = await import('../../services/dashboardService')
      vi.mocked(DashboardService.getDashboardData).mockResolvedValue({
        success: false,
        error: 'Failed to load dashboard data',
        data: {} as any,
        timestamp: new Date()
      })
      
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      )
      
      // Should still render basic structure even with errors
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design Workflow', () => {
    it('should adapt to different screen sizes', async () => {
      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'), // Simulate mobile
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        }))
      })
      
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
      
      // Check that mobile-optimized elements are present
      const cards = screen.getAllByRole('button')
      cards.forEach(card => {
        // All interactive elements should have minimum touch target size
        const rect = card.getBoundingClientRect()
        // Note: In test environment, actual dimensions might not be accurate
        // but we can check for the CSS classes that ensure proper sizing
        expect(card).toHaveClass('touch-target')
      })
    })
  })

  describe('Performance Workflow', () => {
    it('should load components efficiently', async () => {
      const startTime = performance.now()
      
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      // Component should load within reasonable time (adjust threshold as needed)
      expect(loadTime).toBeLessThan(1000) // 1 second
    })
  })
})