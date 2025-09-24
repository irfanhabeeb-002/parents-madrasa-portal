import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '../../../test/utils';
import { AccessibleButton } from '../AccessibleButton';
import { Card } from '../Card';
import { Modal } from '../Modal';

// Mock icon for consistent snapshots
const MockIcon = () => <div data-testid="mock-icon">📚</div>;

describe('Component Snapshots', () => {
  describe('AccessibleButton', () => {
    it('renders default button correctly', () => {
      const { container } = render(
        <AccessibleButton>Default Button</AccessibleButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders primary variant button', () => {
      const { container } = render(
        <AccessibleButton variant="primary" size="lg">
          Primary Button
        </AccessibleButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders button with Malayalam label', () => {
      const { container } = render(
        <AccessibleButton
          id="test-button"
          malayalamLabel="ക്ലിക്ക് ചെയ്യുക"
          variant="secondary"
        >
          Click Me
        </AccessibleButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders loading button', () => {
      const { container } = render(
        <AccessibleButton loading variant="primary">
          Loading Button
        </AccessibleButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders disabled button', () => {
      const { container } = render(
        <AccessibleButton disabled variant="error">
          Disabled Button
        </AccessibleButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders all button variants', () => {
      const variants = [
        'primary',
        'secondary',
        'success',
        'error',
        'warning',
      ] as const;

      variants.forEach(variant => {
        const { container } = render(
          <AccessibleButton variant={variant}>
            {variant.charAt(0).toUpperCase() + variant.slice(1)} Button
          </AccessibleButton>
        );
        expect(container.firstChild).toMatchSnapshot(
          `button-variant-${variant}`
        );
      });
    });

    it('renders all button sizes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;

      sizes.forEach(size => {
        const { container } = render(
          <AccessibleButton size={size}>
            {size.toUpperCase()} Button
          </AccessibleButton>
        );
        expect(container.firstChild).toMatchSnapshot(`button-size-${size}`);
      });
    });
  });

  describe('Card', () => {
    it('renders basic card', () => {
      const { container } = render(<Card title="Basic Card" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders card with subtitle and Malayalam subtitle', () => {
      const { container } = render(
        <Card
          title="Complete Card"
          subtitle="English subtitle"
          malayalamSubtitle="മലയാളം സബ്ടൈറ്റിൽ"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders card with icon', () => {
      const { container } = render(
        <Card title="Card with Icon" icon={<MockIcon />} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders interactive card', () => {
      const { container } = render(
        <Card
          title="Interactive Card"
          onClick={() => {}}
          variant="interactive"
          ariaLabel="Click this card"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders disabled interactive card', () => {
      const { container } = render(
        <Card
          title="Disabled Card"
          onClick={() => {}}
          disabled
          variant="interactive"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders card with children', () => {
      const { container } = render(
        <Card title="Card with Children">
          <div className="p-2 bg-gray-100 rounded">
            <p>Child content here</p>
            <button>Action Button</button>
          </div>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders all card variants', () => {
      const variants = ['default', 'interactive', 'elevated'] as const;

      variants.forEach(variant => {
        const { container } = render(
          <Card
            title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} Card`}
            variant={variant}
            onClick={variant === 'interactive' ? () => {} : undefined}
          />
        );
        expect(container.firstChild).toMatchSnapshot(`card-variant-${variant}`);
      });
    });
  });

  describe('Modal', () => {
    it('renders closed modal (should be empty)', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={() => {}} title="Closed Modal">
          <div>This should not render</div>
        </Modal>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders basic open modal', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Basic Modal">
          <div>Modal content here</div>
        </Modal>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders modal with Malayalam title', () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Modal with Malayalam"
          malayalamTitle="മലയാളം ശീർഷകം"
        >
          <div>Content with Malayalam title</div>
        </Modal>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders modal without close button', () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="No Close Button"
          showCloseButton={false}
        >
          <div>Modal without close button</div>
        </Modal>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders modal with aria-describedby', () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Accessible Modal"
          ariaDescribedBy="modal-description"
        >
          <div id="modal-description">
            This modal has proper ARIA attributes for accessibility
          </div>
        </Modal>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders all modal sizes', () => {
      const sizes = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

      sizes.forEach(size => {
        const { container } = render(
          <Modal
            isOpen={true}
            onClose={() => {}}
            title={`${size.toUpperCase()} Modal`}
            size={size}
          >
            <div>Content for {size} modal</div>
          </Modal>
        );
        expect(container.firstChild).toMatchSnapshot(`modal-size-${size}`);
      });
    });
  });

  describe('Complex Component Combinations', () => {
    it('renders card with accessible button', () => {
      const { container } = render(
        <Card title="Card with Button" icon={<MockIcon />}>
          <div className="space-y-2">
            <AccessibleButton variant="primary" size="sm">
              Primary Action
            </AccessibleButton>
            <AccessibleButton variant="secondary" size="sm">
              Secondary Action
            </AccessibleButton>
          </div>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders modal with card and buttons', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Modal with Card">
          <Card title="Card in Modal" malayalamSubtitle="മോഡലിലെ കാർഡ്">
            <div className="flex space-x-2">
              <AccessibleButton variant="success" size="sm">
                Confirm
              </AccessibleButton>
              <AccessibleButton variant="error" size="sm">
                Cancel
              </AccessibleButton>
            </div>
          </Card>
        </Modal>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders interactive card with Malayalam content', () => {
      const { container } = render(
        <Card
          title="Islamic Studies"
          subtitle="Learn the fundamentals of Islam"
          malayalamSubtitle="ഇസ്ലാമിന്റെ അടിസ്ഥാനകാര്യങ്ങൾ പഠിക്കുക"
          icon={<MockIcon />}
          onClick={() => {}}
          variant="interactive"
          ariaLabel="Join Islamic Studies class"
        >
          <div className="text-sm text-gray-600">
            <p>Next class: Today at 2:00 PM</p>
            <p lang="ml">അടുത്ത ക്ലാസ്: ഇന്ന് ഉച്ചയ്ക്ക് 2:00</p>
          </div>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
