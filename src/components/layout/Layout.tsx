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
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
          ${showBottomNav ? 'pb-20' : 'pb-4'}
        `}
        role="main"
        aria-label="Main content"
      >
        <div className="container mx-auto px-4 py-4 max-w-md">
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation */}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};