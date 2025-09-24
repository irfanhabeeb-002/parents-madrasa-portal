import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/utils';
import { axe } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  beforeEach(() => {
    // Reset body overflow style before each test
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // Clean up body overflow style after each test
    document.body.style.overflow = 'unset';
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Test Modal"
        ariaDescribedBy="modal-description"
      >
        <div id="modal-description">Modal content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
  });

  it('displays Malayalam title when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Test Modal"
        malayalamTitle="ടെസ്റ്റ് മോഡൽ"
      >
        <div>Content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    let malayalamTitle = screen.getByText('ടെസ്റ്റ് മോഡൽ');
    expect(malayalamTitle).toBeInTheDocument();
    expect(malayalamTitle).toHaveAttribute('lang', 'bn');
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test" size="sm">
        <div>Content</div>
      </Modal>
    );

    // Find the modal content container (second child of dialog, after backdrop)
    const modalContent = screen.getByRole('dialog').children[1];
    expect(modalContent).toHaveClass('max-w-sm');

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test" size="md">
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByRole('dialog').children[1]).toHaveClass('max-w-md');

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test" size="lg">
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByRole('dialog').children[1]).toHaveClass('max-w-lg');

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test" size="xl">
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByRole('dialog').children[1]).toHaveClass('max-w-xl');

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test" size="2xl">
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByRole('dialog').children[1]).toHaveClass('max-w-4xl');
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when Escape key is pressed if closeOnEscape is false', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Test Modal"
        closeOnEscape={false}
      >
        <div>Content</div>
      </Modal>
    );

    await user.keyboard('{Escape}');
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    // Click on the backdrop (first child of dialog)
    const backdrop = screen.getByRole('dialog').children[0];
    await user.click(backdrop as Element);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when overlay is clicked if closeOnOverlayClick is false', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Test Modal"
        closeOnOverlayClick={false}
      >
        <div>Content</div>
      </Modal>
    );

    const overlay = screen.getByRole('dialog');
    await user.click(overlay);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div data-testid="modal-content">Content</div>
      </Modal>
    );

    const content = screen.getByTestId('modal-content');
    await user.click(content);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Test Modal"
        showCloseButton={false}
      >
        <div>Content</div>
      </Modal>
    );

    expect(
      screen.queryByRole('button', { name: 'Close modal' })
    ).not.toBeInTheDocument();
  });

  it('manages body scroll correctly', async () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('unset');

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  it('has proper modal structure and styling', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass(
      'fixed',
      'inset-0',
      'z-50',
      'flex',
      'items-center',
      'justify-center'
    );

    // Check backdrop
    const backdrop = dialog.querySelector(
      '.fixed.inset-0.bg-black.bg-opacity-50'
    );
    expect(backdrop).toBeInTheDocument();

    // Check modal content container
    const modalContent = dialog.querySelector(
      '.relative.bg-white.rounded-lg.shadow-xl'
    );
    expect(modalContent).toBeInTheDocument();
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Accessible Modal">
        <div>Modal content for accessibility testing</div>
      </Modal>
    );

    let results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with Malayalam title', async () => {
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Test Modal"
        malayalamTitle="ടെസ്റ്റ് മോഡൽ"
        ariaDescribedBy="modal-desc"
      >
        <div id="modal-desc">Content with Malayalam title</div>
      </Modal>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations without close button', async () => {
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Modal without close button"
        showCloseButton={false}
      >
        <div>Content</div>
      </Modal>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
