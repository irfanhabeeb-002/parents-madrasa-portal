import React from 'react';
import type { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';

interface LayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  showBackButton?: boolean;
  showLogout?: boolean;
  title?: string;
  malayalamTitle?: string;
  onBack?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showBottomNav = true,
  showBackButton = false,
  showLogout = true,
  title,
  malayalamTitle,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <Header
        showBackButton={showBackButton}
        showLogout={showLogout}
        title={title}
        malayalamTitle={malayalamTitle}
        onBack={onBack}
      />
      
      {/* Main Content Area */}
      <main 
        className={`
          flex-1 overflow-y-auto
          ${showBottomNav ? 'pb-20 md:pb-4' : 'pb-4'}
        `}
        role="main"
        aria-label="Main content"
      >
        {/* Mobile Layout */}
        <div className="md:hidden container mx-auto px-4 py-4 max-w-md">
          {children}
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden md:block max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation - Mobile Only */}
      {showBottomNav && (
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      )}
    </div>
  );
};