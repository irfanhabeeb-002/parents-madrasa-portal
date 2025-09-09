import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils'
import { axe } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import { AccessibleButton } from '../AccessibleButton'

describe('AccessibleButton', () => {
  it('renders with correct text content', () => {
    render(<AccessibleButton>Click me</AccessibleButton>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies correct variant classes', () => {
    const { rerender } = render(<AccessibleButton variant="primary">Primary</AccessibleButton>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600')

    rerender(<AccessibleButton variant="secondary">Secondary</AccessibleButton>)
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200')

    rerender(<AccessibleButton variant="success">Success</AccessibleButton>)
    expect(screen.getByRole('button')).toHaveClass('bg-success-600')

    rerender(<AccessibleButton variant="error">Error</AccessibleButton>)
    expect(screen.getByRole('button')).toHaveClass('bg-error-600')

    rerender(<AccessibleButton variant="warning">Warning</AccessibleButton>)
    expect(screen.getByRole('button')).toHaveClass('bg-warning-600')
  })

  it('applies correct size classes and maintains minimum touch target', () => {
    const { rerender } = render(<AccessibleButton size="sm">Small</AccessibleButton>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('min-h-[44px]', 'px-3', 'py-2', 'text-sm')

    rerender(<AccessibleButton size="md">Medium</AccessibleButton>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('min-h-[44px]', 'px-4', 'py-3', 'text-base')

    rerender(<AccessibleButton size="lg">Large</AccessibleButton>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('min-h-[44px]', 'px-6', 'py-4', 'text-lg')
  })

  it('handles click events correctly', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<AccessibleButton onClick={handleClick}>Click me</AccessibleButton>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('handles keyboard navigation (Enter and Space)', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<AccessibleButton onClick={handleClick}>Click me</AccessibleButton>)
    const button = screen.getByRole('button')
    
    button.focus()
    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    await user.keyboard(' ')
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('shows loading state correctly', () => {
    render(<AccessibleButton loading>Loading</AccessibleButton>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button')).toContainHTML('animate-spin')
  })

  it('handles disabled state correctly', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<AccessibleButton disabled onClick={handleClick}>Disabled</AccessibleButton>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    
    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('displays Malayalam label when provided', () => {
    render(
      <AccessibleButton id="test-button" malayalamLabel="ക്ലിക്ക് ചെയ്യുക">
        Click me
      </AccessibleButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-describedby', 'test-button-malayalam')
    expect(screen.getByText('ക്ലിക്ക് ചെയ്യുക')).toBeInTheDocument()
    expect(screen.getByText('ക്ലിക്ക് ചെയ്യുക')).toHaveAttribute('lang', 'ml')
  })

  it('uses custom aria-label when provided', () => {
    render(<AccessibleButton ariaLabel="Custom label">Button text</AccessibleButton>)
    expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<AccessibleButton className="custom-class">Button</AccessibleButton>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<AccessibleButton ref={ref}>Button</AccessibleButton>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('has proper focus styles for accessibility', () => {
    render(<AccessibleButton>Focus me</AccessibleButton>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass(
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'focus:ring-blue-500'
    )
  })

  it('has proper touch target classes', () => {
    render(<AccessibleButton>Touch me</AccessibleButton>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('touch-target', 'min-h-[44px]')
  })

  it('should not have accessibility violations', async () => {
    const { container } = render(<AccessibleButton>Accessible button</AccessibleButton>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should not have accessibility violations with Malayalam label', async () => {
    const { container } = render(
      <AccessibleButton id="test" malayalamLabel="ക്ലിക്ക് ചെയ്യുക">
        Click me
      </AccessibleButton>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(<AccessibleButton disabled>Disabled button</AccessibleButton>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should not have accessibility violations when loading', async () => {
    const { container } = render(<AccessibleButton loading>Loading button</AccessibleButton>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})