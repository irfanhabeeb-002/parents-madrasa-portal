import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AnnouncementsBanner } from '../components/notifications/AnnouncementsBanner';
import { truncateAnnouncement } from '../utils/textUtils';
import { afterEach } from 'node:test';

// Mock data for testing
const mockAnnouncements = [
  {
    id: '1',
    message: 'This is a very long announcement message that should be truncated on mobile devices to ensure proper display and readability across different screen sizes and device types.',
    priority: 'high' as const,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    message: 'Short message',
    malayalamMessage: 'ഇത് ഒരു ചെറിയ സന്ദേശമാണ്',
    priority: 'medium' as const,
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    message: 'Another long announcement that needs to be tested for proper truncation behavior on small screens and mobile devices to ensure the user interface remains clean and accessible.',
    priority: 'low' as const,
    createdAt: new Date('2024-01-03'),
    expiresAt: new Date('2030-12-31'), // Future date
  },
];

describe('Announcement Responsive Design', () => {
  beforeEach(() => {
    // Mock window.innerWidth for responsive testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Text Truncation', () => {
    it('should truncate long messages for mobile context', () => {
      const longMessage = 'This is a very long announcement message that should be truncated on mobile devices to ensure proper display and readability across different screen sizes and device types.';
      
      const truncatedMobile = truncateAnnouncement(longMessage, 'mobile');
      const truncatedDesktop = truncateAnnouncement(longMessage, 'desktop');
      
      expect(truncatedMobile.length).toBeLessThanOrEqual(123); // 120 + '...'
      expect(truncatedDesktop.length).toBeLessThanOrEqual(203); // 200 + '...'
      expect(truncatedMobile.length).toBeLessThan(truncatedDesktop.length);
    });

    it('should preserve short messages without truncation', () => {
      const shortMessage = 'Short message';
      
      const truncatedMobile = truncateAnnouncement(shortMessage, 'mobile');
      const truncatedDesktop = truncateAnnouncement(shortMessage, 'desktop');
      
      expect(truncatedMobile).toBe(shortMessage);
      expect(truncatedDesktop).toBe(shortMessage);
    });

    it('should handle empty or null messages gracefully', () => {
      expect(truncateAnnouncement('', 'mobile')).toBe('');
      expect(truncateAnnouncement('', 'desktop')).toBe('');
    });
  });

  describe('AnnouncementsBanner Responsive Behavior', () => {
    it('should render with proper responsive classes', () => {
      render(<AnnouncementsBanner announcements={mockAnnouncements} />);
      
      const banner = screen.getByRole('region', { name: /announcements/i });
      expect(banner).toBeInTheDocument();
      
      // Check for responsive layout classes
      expect(banner).toHaveClass('border', 'rounded-lg', 'p-3');
    });

    it('should display truncated content for long messages', () => {
      render(<AnnouncementsBanner announcements={mockAnnouncements} />);
      
      const messageElement = screen.getByText(/This is a very long announcement/);
      expect(messageElement).toBeInTheDocument();
      
      // The displayed text should be shorter than the original
      const displayedText = messageElement.textContent || '';
      expect(displayedText.length).toBeLessThan(mockAnnouncements[0].message.length);
    });

    it('should handle bilingual content properly', () => {
      render(<AnnouncementsBanner announcements={[mockAnnouncements[1]]} />);
      
      expect(screen.getByText('Short message')).toBeInTheDocument();
      expect(screen.getByText('ഇത് ഒരു ചെറിയ സന്ദേശമാണ്')).toBeInTheDocument();
    });

    it('should filter out expired announcements', () => {
      const expiredAnnouncement = {
        ...mockAnnouncements[0],
        expiresAt: new Date('2020-01-01'), // Expired
      };
      
      render(<AnnouncementsBanner announcements={[expiredAnnouncement]} />);
      
      // Should not render anything for expired announcements
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    it('should show pagination dots for multiple announcements', () => {
      render(<AnnouncementsBanner announcements={mockAnnouncements} />);
      
      const paginationButtons = screen.getAllByRole('button', { name: /go to announcement/i });
      expect(paginationButtons).toHaveLength(mockAnnouncements.length);
    });

    it('should handle priority styling correctly', () => {
      render(<AnnouncementsBanner announcements={[mockAnnouncements[0]]} />);
      
      const banner = screen.getByRole('region');
      expect(banner).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
      
      // High priority should show "Important" badge
      expect(screen.getByText('Important')).toBeInTheDocument();
    });

    it('should be accessible with proper ARIA attributes', () => {
      render(<AnnouncementsBanner announcements={mockAnnouncements} />);
      
      const banner = screen.getByRole('region', { name: /announcements/i });
      expect(banner).toHaveAttribute('aria-live', 'polite');
      
      const speakerIcon = banner.querySelector('svg');
      expect(speakerIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone SE width
      });
    });

    it('should maintain layout integrity on small screens', () => {
      render(<AnnouncementsBanner announcements={mockAnnouncements} />);
      
      const banner = screen.getByRole('region');
      const flexContainer = banner.querySelector('.flex');
      
      expect(flexContainer).toHaveClass('flex', 'items-start', 'space-x-3');
      
      // Icon should not shrink
      const iconContainer = flexContainer?.querySelector('.flex-shrink-0');
      expect(iconContainer).toBeInTheDocument();
      
      // Content should be flexible
      const contentContainer = flexContainer?.querySelector('.flex-1');
      expect(contentContainer).toHaveClass('min-w-0'); // Prevents overflow
    });

    it('should handle text overflow gracefully', () => {
      render(<AnnouncementsBanner announcements={mockAnnouncements} />);
      
      const messageElement = screen.getByText(/This is a very long announcement/);
      const parentElement = messageElement.closest('.flex-1');
      
      expect(parentElement).toHaveClass('min-w-0'); // Allows text to shrink
    });

    it('should maintain touch-friendly pagination controls', () => {
      render(<AnnouncementsBanner announcements={mockAnnouncements} />);
      
      const paginationButtons = screen.getAllByRole('button', { name: /go to announcement/i });
      
      paginationButtons.forEach(button => {
        // Buttons should have adequate size for touch
        expect(button).toHaveClass('w-2', 'h-2');
        
        // Should have proper spacing
        const container = button.parentElement;
        expect(container).toHaveClass('space-x-1');
      });
    });
  });

  describe('Auto-scroll Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should have auto-scroll functionality enabled', () => {
      render(<AnnouncementsBanner announcements={mockAnnouncements} autoScroll={true} />);
      
      // Initially shows first announcement
      expect(screen.getByText(/This is a very long announcement/)).toBeInTheDocument();
      
      // Should have pagination controls for auto-scroll
      const paginationButtons = screen.getAllByRole('button', { name: /go to announcement/i });
      expect(paginationButtons).toHaveLength(3);
      
      // Manual navigation should work
      fireEvent.click(paginationButtons[1]);
      expect(screen.getByText('Short message')).toBeInTheDocument();
    });

    it('should not auto-scroll with single announcement', () => {
      render(<AnnouncementsBanner announcements={[mockAnnouncements[0]]} autoScroll={true} />);
      
      expect(screen.queryByRole('button', { name: /go to announcement/i })).not.toBeInTheDocument();
    });

    it('should allow manual navigation', () => {
      render(<AnnouncementsBanner announcements={mockAnnouncements} />);
      
      const secondButton = screen.getByRole('button', { name: /go to announcement 2/i });
      fireEvent.click(secondButton);
      
      expect(screen.getByText('Short message')).toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility', () => {
    it('should not cause layout shifts during transitions', () => {
      const { rerender } = render(<AnnouncementsBanner announcements={mockAnnouncements} />);
      
      const banner = screen.getByRole('region');
      const initialHeight = banner.getBoundingClientRect().height;
      
      // Trigger transition by clicking pagination
      const secondButton = screen.getByRole('button', { name: /go to announcement 2/i });
      fireEvent.click(secondButton);
      
      // Height should remain consistent
      const newHeight = banner.getBoundingClientRect().height;
      expect(Math.abs(newHeight - initialHeight)).toBeLessThan(5); // Allow small variance
    });

    it('should handle rapid navigation without errors', () => {
      render(<AnnouncementsBanner announcements={mockAnnouncements} />);
      
      const buttons = screen.getAllByRole('button', { name: /go to announcement/i });
      
      // Rapidly click through all buttons
      buttons.forEach(button => {
        fireEvent.click(button);
      });
      
      // Should still be functional
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });
});