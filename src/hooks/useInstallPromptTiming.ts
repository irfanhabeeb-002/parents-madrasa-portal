/**
 * Hook for managing PWA install prompt timing and user experience best practices
 */

import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/AnalyticsService';

interface InstallPromptTimingConfig {
  initialDelay: number; // Initial delay before showing prompt (ms)
  maxDismissals: number; // Maximum number of dismissals before stopping
  dismissalCooldown: number; // Cooldown period after dismissal (ms)
  engagementThreshold: number; // Minimum engagement time before showing prompt (ms)
  returnUserDelay: number; // Longer delay for users who have dismissed before (ms)
}

interface InstallPromptTimingState {
  canShowPrompt: boolean;
  dismissalCount: number;
  lastDismissed: number | null;
  sessionEngagement: number;
  isEngaged: boolean;
}

const DEFAULT_CONFIG: InstallPromptTimingConfig = {
  initialDelay: 30000, // 30 seconds
  maxDismissals: 3,
  dismissalCooldown: 7 * 24 * 60 * 60 * 1000, // 7 days
  engagementThreshold: 60000, // 1 minute
  returnUserDelay: 60000, // 1 minute for return users
};

export const useInstallPromptTiming = (config: Partial<InstallPromptTimingConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<InstallPromptTimingState>({
    canShowPrompt: false,
    dismissalCount: 0,
    lastDismissed: null,
    sessionEngagement: 0,
    isEngaged: false,
  });

  // Load persisted state from localStorage
  useEffect(() => {
    const dismissalCount = parseInt(localStorage.getItem('installBannerDismissCount') || '0');
    const lastDismissed = localStorage.getItem('installBannerLastDismissed');
    const sessionStartTime = parseInt(sessionStorage.getItem('sessionStartTime') || '0');
    
    setState(prev => ({
      ...prev,
      dismissalCount,
      lastDismissed: lastDismissed ? parseInt(lastDismissed) : null,
      sessionEngagement: sessionStartTime ? Date.now() - sessionStartTime : 0,
    }));
  }, []);

  // Update engagement tracking
  useEffect(() => {
    const interval = setInterval(() => {
      const sessionStartTime = parseInt(sessionStorage.getItem('sessionStartTime') || '0');
      const currentEngagement = sessionStartTime ? Date.now() - sessionStartTime : 0;
      
      setState(prev => ({
        ...prev,
        sessionEngagement: currentEngagement,
        isEngaged: currentEngagement >= finalConfig.engagementThreshold,
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [finalConfig.engagementThreshold]);

  // Determine if prompt can be shown
  useEffect(() => {
    const canShow = () => {
      // Don't show if dismissed too many times
      if (state.dismissalCount >= finalConfig.maxDismissals) {
        return false;
      }

      // Don't show if dismissed recently
      if (state.lastDismissed && Date.now() - state.lastDismissed < finalConfig.dismissalCooldown) {
        return false;
      }

      // Don't show if user hasn't engaged enough
      if (!state.isEngaged) {
        return false;
      }

      // Don't show if session dismissed (for current session)
      if (sessionStorage.getItem('installBannerDismissed') === 'true') {
        return false;
      }

      return true;
    };

    const newCanShowPrompt = canShow();
    setState(prev => {
      // Only update if the value actually changed to prevent infinite loops
      if (prev.canShowPrompt !== newCanShowPrompt) {
        return {
          ...prev,
          canShowPrompt: newCanShowPrompt,
        };
      }
      return prev;
    });
  }, [state.dismissalCount, state.lastDismissed, state.isEngaged, finalConfig.maxDismissals, finalConfig.dismissalCooldown]);

  // Calculate appropriate delay for showing prompt
  const getPromptDelay = useCallback(() => {
    if (state.dismissalCount === 0) {
      return finalConfig.initialDelay;
    }
    return finalConfig.returnUserDelay;
  }, [state.dismissalCount, finalConfig]);

  // Handle prompt dismissal
  const handleDismissal = useCallback((method: 'close_button' | 'outside_click' | 'escape_key' = 'close_button') => {
    const newDismissalCount = state.dismissalCount + 1;
    const dismissalTime = Date.now();

    // Update localStorage
    localStorage.setItem('installBannerDismissCount', newDismissalCount.toString());
    localStorage.setItem('installBannerLastDismissed', dismissalTime.toString());
    
    // Update session storage
    sessionStorage.setItem('installBannerDismissed', 'true');

    // Update state
    setState(prev => ({
      ...prev,
      dismissalCount: newDismissalCount,
      lastDismissed: dismissalTime,
      canShowPrompt: false,
    }));

    // Track dismissal
    analyticsService.trackPWAInstallFunnel('banner_clicked', 'dismissal', {
      dismissal_method: method,
      dismissal_count: newDismissalCount,
      session_engagement: state.sessionEngagement,
      will_show_again: newDismissalCount < finalConfig.maxDismissals,
    });
  }, [state.dismissalCount, state.sessionEngagement, finalConfig.maxDismissals]);

  // Handle successful installation
  const handleInstallation = useCallback(() => {
    // Clear dismissal tracking since user installed
    localStorage.removeItem('installBannerLastDismissed');
    localStorage.removeItem('installBannerDismissCount');
    sessionStorage.removeItem('installBannerDismissed');

    setState(prev => ({
      ...prev,
      dismissalCount: 0,
      lastDismissed: null,
      canShowPrompt: false,
    }));

    // Track successful installation
    analyticsService.trackPWAInstallFunnel('install_completed', 'success', {
      session_engagement: state.sessionEngagement,
      previous_dismissals: state.dismissalCount,
    });
  }, [state.sessionEngagement, state.dismissalCount]);

  // Handle prompt shown
  const handlePromptShown = useCallback((source: string = 'automatic') => {
    analyticsService.trackPWAInstallFunnel('banner_shown', source, {
      dismissal_count: state.dismissalCount,
      session_engagement: state.sessionEngagement,
      timing_delay: getPromptDelay(),
      is_return_user: state.dismissalCount > 0,
    });
  }, [state.dismissalCount, state.sessionEngagement, getPromptDelay]);

  // Handle prompt interaction
  const handlePromptInteraction = useCallback((action: 'learn_more' | 'install_now', source: string = 'banner') => {
    const eventMap = {
      learn_more: 'modal_opened',
      install_now: 'install_clicked',
    } as const;

    analyticsService.trackPWAInstallFunnel(eventMap[action], source, {
      dismissal_count: state.dismissalCount,
      session_engagement: state.sessionEngagement,
      user_engagement_level: state.isEngaged ? 'high' : 'low',
    });
  }, [state.dismissalCount, state.sessionEngagement, state.isEngaged]);

  return {
    // State
    canShowPrompt: state.canShowPrompt,
    dismissalCount: state.dismissalCount,
    sessionEngagement: state.sessionEngagement,
    isEngaged: state.isEngaged,
    
    // Timing
    promptDelay: getPromptDelay(),
    
    // Actions
    handleDismissal,
    handleInstallation,
    handlePromptShown,
    handlePromptInteraction,
    
    // Config
    config: finalConfig,
  };
};