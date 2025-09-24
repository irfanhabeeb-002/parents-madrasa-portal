import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnnouncementsBanner } from '../components/notifications/AnnouncementsBanner';

// Mock data for visual testing
const longAnnouncement = {
  id: '1',
  message:
    'This is a very long announcement message that should be properly truncated on mobile devices to ensure optimal user experience and readability across all screen sizes and device types.',
  priority: 'high' as const,
  createdAt: new Date(),
};

describe('Responsive Visual Tests', () => {
  it('should handle very long content without breaking layout', () => {
    render(<AnnouncementsBanner announcements={[longAnnouncement]} />);

    const banner = screen.getByRole('region');
    const messageElement = screen.getByText(/This is a very long announcement/);

    // Ensure the component renders without errors
    expect(banner).toBeInTheDocument();
    expect(messageElement).toBeInTheDocument();

    // Check that the message is truncated (should be shorter than original)
    const displayedText = messageElement.textContent || '';
    expect(displayedText.length).toBeLessThan(longAnnouncement.message.length);
    expect(displayedText).toMatch(/\.\.\.$/); // Should end with ellipsis
  });

  it('should maintain proper spacing and layout structure', () => {
    render(<AnnouncementsBanner announcements={[longAnnouncement]} />);

    const banner = screen.getByRole('region');
    const flexContainer = banner.querySelector('.flex');
    const iconContainer = flexContainer?.querySelector('.flex-shrink-0');
    const contentContainer = flexContainer?.querySelector('.flex-1');

    // Verify layout structure
    expect(flexContainer).toHaveClass('flex', 'items-start', 'space-x-3');
    expect(iconContainer).toBeInTheDocument();
    expect(contentContainer).toHaveClass('min-w-0'); // Prevents overflow
  });

  it('should apply proper responsive classes', () => {
    render(<AnnouncementsBanner announcements={[longAnnouncement]} />);

    const banner = screen.getByRole('region');

    // Check for responsive design classes
    expect(banner).toHaveClass('border', 'rounded-lg', 'p-3', 'shadow-sm');
    expect(banner).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800'); // High priority styling
  });
});
