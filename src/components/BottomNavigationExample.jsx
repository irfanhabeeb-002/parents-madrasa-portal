import React, { useState } from 'react';
import BottomNavigation from './BottomNavigation';

const BottomNavigationExample = () => {
  const [activeTab, setActiveTab] = useState('home');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    console.log('Active tab changed to:', tabId);
    // Here you can add navigation logic, e.g., using React Router
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Home</h2>
            <p>Welcome to the home page</p>
          </div>
        );
      case 'live-class':
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Live Class</h2>
            <p>Join your live classes here</p>
          </div>
        );
      case 'profile':
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Profile</h2>
            <p>Manage your profile settings</p>
          </div>
        );
      case 'settings':
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Settings</h2>
            <p>Configure your app preferences</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh' }}>
      {renderContent()}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
    </div>
  );
};

export default BottomNavigationExample;