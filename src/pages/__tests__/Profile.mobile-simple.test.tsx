import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Profile } from '../Profile'
import { FontSizeProvider } from '../../contexts/FontSizeContext'

// Mock the useAuth hook to return a test user
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-123',
      displayName: 'Test User',
      phone: '+919876543210',
      email: 'test@example.com',
      role: 'parent'
    },
    logout: vi.fn(),
    loginWithPhone: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn()
  })
}))

// Helper to render Profile with required providers
const renderProfile = () => {
  return render(
    <FontSizeProvider>
      <Profile />
    </FontSizeProvider>
  )
}

// Helper to simulate different screen sizes
const setViewportSize = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'))
}

describe('Profile Mobile Responsiveness - Core Tests', () => {
  beforeEach(() => {
    // Reset viewport to mobile size before each test
    setViewportSize(375) // iPhone SE width
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset viewport after each test
    setViewportSize(1024) // Desktop width
  })

  describe('Mobile Layout Structure', () => {
    it('should render profile page with proper mobile structure', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check that main elements are present
      expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument()
      expect(screen.getByText('പ്രൊഫൈൽ')).toBeInTheDocument()
      
      // Check that main card titles are present (there may be additional h3 elements)
      const cardTitles = screen.getAllByRole('heading', { level: 3 })
      expect(cardTitles.length).toBeGreaterThanOrEqual(3)
      
      // Verify card titles
      expect(screen.getByText('User Information')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Account Actions')).toBeInTheDocument()
    })

    it('should display user information fields on mobile', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check user information fields
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('Phone Number')).toBeInTheDocument()
      expect(screen.getByText('+919876543210')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('User ID')).toBeInTheDocument()
      expect(screen.getByText('test-user-123')).toBeInTheDocument()
    })

    it('should display settings section on mobile', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check settings section
      expect(screen.getByText('Font Size')).toBeInTheDocument()
      expect(screen.getByText('ഫോണ്ട് വലുപ്പം')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('അറിയിപ്പുകൾ')).toBeInTheDocument()
      
      // Check notification toggles
      expect(screen.getByText('Class Reminders')).toBeInTheDocument()
      expect(screen.getByText('New Content Alerts')).toBeInTheDocument()
      expect(screen.getByText('Exam Reminders')).toBeInTheDocument()
    })

    it('should display account actions section on mobile', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check account actions section (use getAllByText for multiple instances)
      expect(screen.getAllByText('Logout')).toHaveLength(2) // Title and button text
      expect(screen.getByText('പുറത്തുകടക്കുക')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /logout from application/i })).toBeInTheDocument()
    })
  })

  describe('Mobile Typography and Spacing', () => {
    it('should have proper mobile typography classes', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check main title has mobile typography
      const mainTitle = screen.getByRole('heading', { name: /profile/i })
      expect(mainTitle).toHaveClass('text-xl')
      
      // Check Malayalam subtitle has mobile typography
      const malayalamSubtitle = screen.getByText('പ്രൊഫൈൽ')
      expect(malayalamSubtitle).toHaveClass('text-sm')
    })

    it('should have proper mobile spacing classes', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check main container has mobile spacing
      const mainContainer = screen.getByText('Profile').closest('.space-y-4')
      expect(mainContainer).toHaveClass('space-y-4', 'sm:space-y-6')
      
      // Check mobile padding
      expect(mainContainer).toHaveClass('px-2', 'sm:px-4')
    })
  })

  describe('Interactive Elements', () => {
    it('should have proper touch targets for interactive elements', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check logout button has proper mobile sizing
      const logoutButton = screen.getByRole('button', { name: /logout from application/i })
      expect(logoutButton).toHaveClass('!min-h-[48px]')
      
      // Check notification toggles have proper sizing
      const toggles = screen.getAllByRole('switch')
      toggles.forEach(toggle => {
        expect(toggle).toHaveClass('min-h-[44px]')
      })
    })
  })

  describe('Malayalam Text Rendering', () => {
    it('should render Malayalam text with proper lang attributes', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check Malayalam elements have proper lang attribute
      const malayalamElements = [
        screen.getByText('പ്രൊഫൈൽ'),
        screen.getByText('നിങ്ങളുടെ അക്കൗണ്ട് വിവരങ്ങൾ'),
        screen.getByText('പേര്'),
        screen.getByText('ഫോൺ നമ്പർ'),
        screen.getByText('ഇമെയിൽ'),
        screen.getByText('ഉപയോക്തൃ ഐഡി'),
        screen.getByText('ഫോണ്ട് വലുപ്പം'),
        screen.getByText('അറിയിപ്പുകൾ'),
        screen.getByText('പുറത്തുകടക്കുക')
      ]
      
      malayalamElements.forEach(element => {
        expect(element).toHaveAttribute('lang', 'ml')
      })
    })

    it('should have proper mobile typography for Malayalam text', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check Malayalam field labels have proper mobile classes
      const malayalamLabels = [
        screen.getByText('പേര്'),
        screen.getByText('ഫോൺ നമ്പർ'),
        screen.getByText('ഇമെയിൽ'),
        screen.getByText('ഉപയോക്തൃ ഐഡി')
      ]
      
      malayalamLabels.forEach(label => {
        expect(label).toHaveClass('text-xs', 'sm:text-sm')
      })
    })
  })

  describe('Cross-Device Consistency', () => {
    const testSizes = [
      { width: 320, name: 'Small Mobile' },
      { width: 375, name: 'Standard Mobile' },
      { width: 414, name: 'Large Mobile' },
      { width: 640, name: 'Small Tablet' }
    ]

    testSizes.forEach(({ width, name }) => {
      it(`should maintain consistent structure on ${name} (${width}px)`, () => {
        setViewportSize(width)
        renderProfile()
        
        // Check that all main elements are present regardless of screen size
        expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument()
        expect(screen.getByText('പ്രൊഫൈൽ')).toBeInTheDocument()
        
        // Check that main cards are present
        const cardTitles = screen.getAllByRole('heading', { level: 3 })
        expect(cardTitles.length).toBeGreaterThanOrEqual(3)
        
        // Check that interactive elements are present
        expect(screen.getByRole('button', { name: /logout from application/i })).toBeInTheDocument()
        const toggles = screen.getAllByRole('switch')
        expect(toggles.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Text Wrapping and Overflow', () => {
    it('should handle long text content properly', () => {
      setViewportSize(320) // Very small screen
      renderProfile()
      
      // Check that email field has proper wrapping classes
      const emailField = screen.getByText('test@example.com')
      expect(emailField).toHaveClass('break-words', 'overflow-wrap-anywhere')
      
      // Check that user ID has proper wrapping classes
      const userIdField = screen.getByText('test-user-123')
      expect(userIdField).toHaveClass('break-all')
    })

    it('should maintain proper line height for readability', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check that text elements have proper line height
      const textElements = [
        screen.getByText('Test User'),
        screen.getByText('test@example.com'),
        screen.getByText(/sign out of your account/i)
      ]
      
      textElements.forEach(element => {
        expect(element).toHaveClass('leading-relaxed')
      })
    })
  })

  describe('Responsive Classes Validation', () => {
    it('should use proper responsive classes for spacing', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check that responsive spacing classes are used
      const spacingElements = screen.getByText('Profile').closest('.space-y-4')
      expect(spacingElements).toHaveClass('space-y-4', 'sm:space-y-6')
      
      // Check responsive padding
      expect(spacingElements).toHaveClass('px-2', 'sm:px-4', 'md:px-0')
    })

    it('should use proper responsive classes for typography', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check main title responsive typography
      const mainTitle = screen.getByRole('heading', { name: /profile/i })
      expect(mainTitle).toHaveClass('text-xl', 'sm:text-2xl', 'lg:text-3xl')
      
      // Check subtitle responsive typography
      const subtitle = screen.getByText('പ്രൊഫൈൽ')
      expect(subtitle).toHaveClass('text-sm', 'sm:text-base', 'lg:text-lg')
    })

    it('should use proper responsive classes for interactive elements', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check logout button responsive classes
      const logoutButton = screen.getByRole('button', { name: /logout from application/i })
      expect(logoutButton).toHaveClass('px-4', 'py-3', 'sm:px-6', 'sm:py-3', 'lg:px-8', 'lg:py-4')
    })
  })

  describe('Performance and Layout', () => {
    it('should render without layout issues', () => {
      setViewportSize(375)
      const { container } = renderProfile()
      
      // Check that the component renders without errors
      expect(container.firstChild).toBeInTheDocument()
      
      // Check that main structure is present
      expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument()
    })

    it('should maintain proper card structure', () => {
      setViewportSize(375)
      renderProfile()
      
      // Check that cards are rendered with proper structure
      const cards = screen.getAllByRole('heading', { level: 3 })
      expect(cards.length).toBeGreaterThanOrEqual(3)
      
      // Each card should have its content
      expect(screen.getByText('User Information')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Account Actions')).toBeInTheDocument()
    })
  })
})
