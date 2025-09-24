import React from 'react';
import { InstallButton } from './InstallButton';

/**
 * Example component demonstrating different InstallButton variants and usage patterns
 * This can be used as a reference for implementing install buttons throughout the app
 */
export const InstallButtonExample: React.FC = () => {
  const handleInstallStart = () => {
    console.log('Install process started');
  };

  const handleInstallComplete = (success: boolean) => {
    if (success) {
      console.log('App installed successfully!');
    } else {
      console.log('App installation was cancelled or failed');
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Install Button Examples</h2>
        <p className="text-gray-600 mb-6">
          Different variants and sizes of the InstallButton component
        </p>
      </div>

      {/* Primary Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Primary Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <InstallButton
            size="sm"
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          />
          <InstallButton
            size="md"
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          />
          <InstallButton
            size="lg"
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          />
        </div>
      </div>

      {/* Secondary Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Secondary Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <InstallButton
            variant="secondary"
            size="sm"
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          />
          <InstallButton
            variant="secondary"
            size="md"
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          />
          <InstallButton
            variant="secondary"
            size="lg"
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          />
        </div>
      </div>

      {/* Minimal Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Minimal Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <InstallButton
            variant="minimal"
            size="sm"
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          />
          <InstallButton
            variant="minimal"
            size="md"
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          />
          <InstallButton
            variant="minimal"
            size="lg"
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          />
        </div>
      </div>

      {/* Custom Content */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Custom Content</h3>
        <div className="flex flex-wrap gap-4">
          <InstallButton
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          >
            Install Madrasa Portal
          </InstallButton>
          <InstallButton
            variant="secondary"
            showIcon={false}
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          >
            Get App
          </InstallButton>
          <InstallButton
            variant="minimal"
            onInstallStart={handleInstallStart}
            onInstallComplete={handleInstallComplete}
          >
            📱 Install Now
          </InstallButton>
        </div>
      </div>

      {/* Usage in different contexts */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Context Examples</h3>
        
        {/* Header/Navigation context */}
        <div className="bg-primary-700 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Madrasa Portal</h4>
            <InstallButton
              variant="secondary"
              size="sm"
              className="bg-white text-primary-700 hover:bg-gray-100"
              onInstallStart={handleInstallStart}
              onInstallComplete={handleInstallComplete}
            >
              Install
            </InstallButton>
          </div>
        </div>

        {/* Card/Banner context */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-2">Get the App</h4>
            <p className="text-gray-600 mb-4">
              Install Madrasa Portal for quick access and offline functionality
            </p>
            <InstallButton
              size="lg"
              onInstallStart={handleInstallStart}
              onInstallComplete={handleInstallComplete}
            >
              Install App
            </InstallButton>
          </div>
        </div>

        {/* Inline context */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-blue-800 mb-2">
            💡 <strong>Tip:</strong> Install this app for a better experience.{' '}
            <InstallButton
              variant="minimal"
              size="sm"
              className="inline-flex"
              onInstallStart={handleInstallStart}
              onInstallComplete={handleInstallComplete}
            >
              Install now
            </InstallButton>
          </p>
        </div>
      </div>
    </div>
  );
};