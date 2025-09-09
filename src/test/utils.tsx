import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock user data for testing
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  phone: '+919876543210',
  displayName: 'Test User',
  role: 'parent' as const,
  createdAt: new Date()
}

// Mock class session data
export const mockClassSession = {
  id: 'class-123',
  title: 'Islamic Studies',
  description: 'Basic Islamic principles',
  scheduledAt: new Date(),
  zoomMeetingId: '123456789',
  zoomJoinUrl: 'https://zoom.us/j/123456789',
  isLive: false,
  status: 'scheduled' as const,
  reminderSent: false
}

// Mock recording data
export const mockRecording = {
  id: 'recording-123',
  classSessionId: 'class-123',
  title: 'Islamic Studies Recording',
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  videoUrl: 'https://example.com/video.mp4',
  duration: 3600,
  uploadedAt: new Date()
}

// Mock note data
export const mockNote = {
  id: 'note-123',
  classSessionId: 'class-123',
  title: 'Islamic Principles Notes',
  content: 'Basic principles of Islam...',
  pdfUrl: 'https://example.com/notes.pdf',
  createdAt: new Date()
}

// Mock exercise data
export const mockExercise = {
  id: 'exercise-123',
  noteId: 'note-123',
  questions: [
    {
      id: 'q1',
      type: 'mcq' as const,
      question: 'What are the five pillars of Islam?',
      options: ['Shahada, Salah, Zakat, Sawm, Hajj', 'Other options'],
      correctAnswer: 'Shahada, Salah, Zakat, Sawm, Hajj',
      points: 10
    }
  ],
  timeLimit: 1800,
  passingScore: 70,
  type: 'practice' as const,
  progressTracking: true
}

// Custom render function with router
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Accessibility testing helper
export const axeConfig = {
  rules: {
    // Disable color-contrast rule for testing as it can be flaky
    'color-contrast': { enabled: false }
  }
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to simulate user interactions
export const simulateKeyPress = (element: Element, key: string) => {
  const event = new KeyboardEvent('keydown', { key })
  element.dispatchEvent(event)
}

// Helper to check if element is in viewport
export const isInViewport = (element: Element) => {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

// Helper to check touch target size (minimum 44px)
export const checkTouchTargetSize = (element: Element) => {
  const rect = element.getBoundingClientRect()
  return rect.width >= 44 && rect.height >= 44
}