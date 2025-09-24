import React from 'react';

interface SkipLinksProps {
  links?: Array<{
    href: string;
    label: string;
    malayalamLabel?: string;
  }>;
}

const defaultLinks = [
  {
    href: '#main-content',
    label: 'Skip to main content',
    malayalamLabel: 'പ്രധാന ഉള്ളടക്കത്തിലേക്ക് പോകുക',
  },
  {
    href: '#navigation',
    label: 'Skip to navigation',
    malayalamLabel: 'നാവിഗേഷനിലേക്ക് പോകുക',
  },
  {
    href: '#footer',
    label: 'Skip to footer',
    malayalamLabel: 'അടിക്കുറിപ്പിലേക്ക് പോകുക',
  },
];

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = defaultLinks,
}) => {
  return (
    <div className="skip-links">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="
            sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
            bg-blue-600 text-white px-4 py-2 rounded-md font-medium
            z-50 focus:z-50 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
          onFocus={e => {
            // Ensure the skip link is visible when focused
            e.currentTarget.classList.remove('sr-only');
          }}
          onBlur={e => {
            // Hide the skip link when focus is lost
            e.currentTarget.classList.add('sr-only');
          }}
        >
          <span className="block">{link.label}</span>
          {link.malayalamLabel && (
            <span className="block text-sm opacity-90" lang="ml">
              {link.malayalamLabel}
            </span>
          )}
        </a>
      ))}
    </div>
  );
};
