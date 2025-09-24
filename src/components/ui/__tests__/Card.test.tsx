import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils';
import { axe } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { Card } from '../Card';

// Mock icon component
const MockIcon = () => <div data-testid="mock-icon">📚</div>;

describe('Card', () => {
  it('renders with title', () => {
    render(<Card title="Test Card" />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Test Card'
    );
  });

  it('renders with subtitle', () => {
    render(<Card title="Test Card" subtitle="Test subtitle" />);
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('renders with Malayalam subtitle', () => {
    render(<Card title="Test Card" malayalamSubtitle="ടെസ്റ്റ് കാർഡ്" />);
    const malayalamText = screen.getByText('ടെസ്റ്റ് കാർഡ്');
    expect(malayalamText).toBeInTheDocument();
    expect(malayalamText).toHaveAttribute('lang', 'bn');
  });

  it('renders with icon', () => {
    render(<Card title="Test Card" icon={<MockIcon />} />);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Card title="Test Card">
        <div data-testid="child-content">Child content</div>
      </Card>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<Card title="Test" variant="default" />);
    // Find the outermost card container
    const cardContainer = screen
      .getByText('Test')
      .closest('div')?.parentElement;
    expect(cardContainer).toHaveClass('shadow-sm');

    rerender(<Card title="Test" variant="elevated" />);
    const elevatedContainer = screen
      .getByText('Test')
      .closest('div')?.parentElement;
    expect(elevatedContainer).toHaveClass('shadow-lg');
  });

  it('renders as interactive button when onClick is provided', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Card
        title="Clickable Card"
        onClick={handleClick}
        variant="interactive"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('cursor-pointer', 'hover:shadow-lg');

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation when interactive', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Card title="Keyboard Card" onClick={handleClick} />);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('handles disabled state correctly', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Card title="Disabled Card" onClick={handleClick} disabled />);

    // Find the button element (when onClick is provided, Card renders as button)
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');

    // Should not be clickable when disabled
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('uses custom aria-label when provided', () => {
    render(
      <Card title="Test Card" onClick={() => {}} ariaLabel="Custom label" />
    );
    expect(
      screen.getByRole('button', { name: 'Custom label' })
    ).toBeInTheDocument();
  });

  it('uses title as aria-label when no custom label provided', () => {
    render(<Card title="Test Card" onClick={() => {}} />);
    expect(
      screen.getByRole('button', { name: 'Test Card' })
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card title="Test Card" className="custom-class" />);
    // Find the outermost card container
    const cardContainer = screen
      .getByText('Test Card')
      .closest('div')?.parentElement;
    expect(cardContainer).toHaveClass('custom-class');
  });

  it('renders as div when not interactive', () => {
    render(<Card title="Static Card" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Static Card').closest('div')).toBeInTheDocument();
  });

  it('has proper touch target classes when interactive', () => {
    render(
      <Card title="Touch Card" onClick={() => {}} variant="interactive" />
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('touch-target');
  });

  it('displays all content elements together', () => {
    render(
      <Card
        title="Complete Card"
        subtitle="English subtitle"
        malayalamSubtitle="മലയാളം സബ്ടൈറ്റിൽ"
        icon={<MockIcon />}
        onClick={() => {}}
      >
        <div data-testid="card-content">Additional content</div>
      </Card>
    );

    expect(screen.getByText('Complete Card')).toBeInTheDocument();
    expect(screen.getByText('English subtitle')).toBeInTheDocument();
    expect(screen.getByText('മലയാളം സബ്ടൈറ്റിൽ')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('should not have accessibility violations - static card', async () => {
    const { container } = render(
      <Card
        title="Accessible Card"
        subtitle="Subtitle"
        malayalamSubtitle="മലയാളം"
        icon={<MockIcon />}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations - interactive card', async () => {
    const { container } = render(
      <Card
        title="Interactive Card"
        onClick={() => {}}
        ariaLabel="Click this card"
        variant="interactive"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations - disabled card', async () => {
    const { container } = render(
      <Card title="Disabled Card" onClick={() => {}} disabled />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
