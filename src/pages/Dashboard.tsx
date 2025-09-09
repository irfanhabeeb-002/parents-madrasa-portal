import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { NotificationBanner } from '../components/ui/NotificationBanner';
import { WhatsAppButton } from '../components/ui/WhatsAppButton';
import { DailyBanner, AnnouncementsBanner } from '../components/notifications';
import { useDashboard } from '../hooks/useDashboard';
import { useNotifications } from '../contexts/NotificationContext';
import { useNotificationListener, useClassReminderListener } from '../hooks/useNotificationListener';
import {
  VideoCameraIcon,
  PlayIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    announcements,
    notifications: dashboardNotifications,
    todaysClass,
    loading,
    error,
    refreshAnnouncements,
    refreshNotifications,
    refreshTodaysClass,
    clearError
  } = useDashboard();

  // Notification system
  const { notifications, unreadCount } = useNotifications();
  
  // Set up real-time notification listeners
  useNotificationListener({ enabled: true });
  useClassReminderListener({ enabled: true });

  // Get unread notifications for banner display
  const unreadNotifications = useMemo(() =>
    notifications.filter(notification => !notification.read),
    [notifications]);

  // Convert announcements to the format expected by AnnouncementsBanner
  const announcementBannerData = useMemo(() =>
    announcements.map(announcement => ({
      id: announcement.id,
      message: announcement.message,
      malayalamMessage: announcement.malayalamMessage,
      priority: announcement.priority || 'medium' as const,
      createdAt: announcement.createdAt instanceof Date ? announcement.createdAt : new Date(announcement.createdAt),
      expiresAt: announcement.expiresAt ? (announcement.expiresAt instanceof Date ? announcement.expiresAt : new Date(announcement.expiresAt)) : undefined
    })),
    [announcements]
  );

  // Format today's class time
  const todaysClassTime = useMemo(() => {
    if (!todaysClass) return null;

    // Handle both Date and Timestamp objects
    const toDate = (dateValue: any): Date => {
      if (dateValue instanceof Date) {
        return dateValue;
      }
      // Handle Firestore Timestamp or string
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000 + (dateValue.nanoseconds || 0) / 1000000);
      }
      return new Date(dateValue);
    };

    return toDate(todaysClass.scheduledAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, [todaysClass]);

  const navigationCards = [
    {
      title: "Live Class",
      malayalamSubtitle: "ലൈവ് ക്ലാസ്",
      icon: <VideoCameraIcon className="w-8 h-8" />,
      onClick: () => navigate('/live-class'),
      ariaLabel: "Join live class session"
    },
    {
      title: "Recordings",
      malayalamSubtitle: "റെക്കോർഡിംഗുകൾ",
      icon: <PlayIcon className="w-8 h-8" />,
      onClick: () => navigate('/recordings'),
      ariaLabel: "View recorded class sessions"
    },
    {
      title: "Notes/Exercises",
      malayalamSubtitle: "കുറിപ്പുകളും അഭ്യാസങ്ങളും",
      icon: <DocumentTextIcon className="w-8 h-8" />,
      onClick: () => navigate('/notes-exercises'),
      ariaLabel: "Access lesson notes and practice exercises"
    },
    {
      title: "Exams/Attendance",
      malayalamSubtitle: "പരീക്ഷകളും ഹാജരും",
      icon: <AcademicCapIcon className="w-8 h-8" />,
      onClick: () => navigate('/exams-attendance'),
      ariaLabel: "View exams and attendance records"
    }
  ];



  const getCardDescription = (title: string): string => {
    switch (title) {
      case "Live Class":
        return "Join live interactive sessions with your teachers and classmates";
      case "Recordings":
        return "Access recorded lessons and review past class sessions";
      case "Notes/Exercises":
        return "Study materials, practice exercises, and homework assignments";
      case "Exams/Attendance":
        return "View exam schedules, results, and track your attendance";
      default:
        return "Access your learning resources";
    }
  };

  return (
    <Layout>
      {/* Mobile Layout */}
      <div className="md:hidden space-y-6">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600 font-malayalam" lang="ml">
            നിങ്ങളുടെ ഡാഷ്‌ബോർഡിലേക്ക് സ്വാഗതം
          </p>
        </div>

        {/* ARIA Live Region for Screen Reader Announcements */}
        <div 
          aria-live="polite" 
          aria-label="Notification updates"
          className="sr-only"
          id="notification-live-region"
        >
          {unreadNotifications.length > 0 && 
            `You have ${unreadNotifications.length} new notification${unreadNotifications.length > 1 ? 's' : ''}`
          }
        </div>

        {/* Today's Class Banner */}
        {loading.todaysClass ? (
          <SkeletonLoader className="h-16" />
        ) : error.todaysClass ? (
          <NotificationBanner
            type="warning"
            title="Unable to load today's class"
            message={error.todaysClass}
            malayalamMessage="আজকের ক্লাসের তথ্য লোড করতে পারছি না"
            onDismiss={() => clearError('todaysClass')}
          />
        ) : todaysClass ? (
          <DailyBanner
            classTitle={todaysClass.title}
            classTime={todaysClassTime || ''}
            malayalamTitle={todaysClass.title}
            onJoinClass={() => navigate('/live-class')}
            isLive={todaysClass.status === 'live'}
          />
        ) : null}

        {/* Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <NotificationBanner
            type="info"
            title={`${unreadNotifications.length} new notification${unreadNotifications.length > 1 ? 's' : ''}`}
            message={unreadNotifications[0].message}
            malayalamMessage={unreadNotifications[0].malayalamMessage}

          />
        )}

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-2 gap-4">
          {navigationCards.map((card, index) => (
            <Card
              key={index}
              title={card.title}
              malayalamSubtitle={card.malayalamSubtitle}
              icon={card.icon}
              onClick={card.onClick}
              ariaLabel={card.ariaLabel}
              variant="interactive"
              className="min-h-[120px] flex items-center justify-center"
            />
          ))}
        </div>

        {/* Announcements Banner */}
        {loading.announcements ? (
          <SkeletonLoader className="h-16" />
        ) : error.announcements ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center text-red-600 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
              <span>Failed to load announcements</span>
              <button
                onClick={refreshAnnouncements}
                className="ml-4 text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                aria-label="Retry loading announcements"
              >
                Retry
              </button>
            </div>
          </div>
        ) : announcementBannerData.length > 0 ? (
          <AnnouncementsBanner
            announcements={announcementBannerData}
            autoScroll={true}
            scrollSpeed={100}
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-500 text-sm">No announcements at this time</p>
            <p className="text-gray-400 text-xs mt-1" lang="ml">ഇപ്പോൾ അറിയിപ്പുകളൊന്നുമില്ല</p>
          </div>
        )}

        {/* Floating WhatsApp Button */}
        <WhatsAppButton
          teacherNumber="+918078769771"
          message="السلام عليكم"
          position="bottom-right"
          showLabel={true}
          malayalamLabel="അധ്യാপകനെ ചോദിക്കുക"
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block space-y-12 desktop-layout">
        {/* Welcome Section */}
        <div className="text-left desktop-welcome">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 font-inter" style={{ fontSize: '22px' }}>
            Welcome to Your Dashboard
          </h1>
          <p className="text-lg text-gray-600 font-medium" lang="ml" style={{ fontSize: '16px' }}>
            സ്വാഗതം നിങ്ങളുടെ ഡാഷ്‌ബോർഡിലേക്ക്
          </p>
        </div>

        {/* Urgent Class Banner */}
        {loading.todaysClass ? (
          <SkeletonLoader className="h-24" />
        ) : error.todaysClass ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-400 mr-4" />
              <div>
                <h3 className="text-xl font-semibold text-red-800">Unable to load today's class</h3>
                <p className="text-lg text-red-600 mt-1">{error.todaysClass}</p>
              </div>
            </div>
          </div>
        ) : todaysClass ? (
          <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-green-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-green-800" style={{ fontSize: '18px' }}>Your class starts today at {todaysClassTime}!</h3>
                <p className="text-base text-green-600 mt-1" style={{ fontSize: '16px' }}>{todaysClass.title}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Dashboard Cards - 2x2 Grid */}
        <div className="desktop-card-grid">
          {navigationCards.map((card, index) => (
            <div
              key={index}
              onClick={card.onClick}
              className="desktop-card"
              role="button"
              tabIndex={0}
              aria-label={card.ariaLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  card.onClick();
                }
              }}
            >
              {/* Large Icon at Top */}
              <div className="desktop-card-icon">
                {React.cloneElement(card.icon as React.ReactElement, {
                  className: "w-full h-full",
                  strokeWidth: 1.5
                } as any)}
              </div>

              {/* Title */}
              <h3 className="desktop-card-title font-inter">
                {card.title}
              </h3>

              {/* Description */}
              <p className="desktop-card-description">
                {getCardDescription(card.title)}
              </p>

              {/* Malayalam Subtitle */}
              <p className="desktop-card-subtitle" lang="ml">
                {card.malayalamSubtitle}
              </p>
            </div>
          ))}
        </div>

        {/* Announcements Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 font-inter" style={{ fontSize: '18px' }}>
            Announcements
          </h2>

          {loading.announcements ? (
            <SkeletonLoader className="h-12" />
          ) : error.announcements ? (
            <div className="flex items-center text-red-600 text-lg">
              <ExclamationTriangleIcon className="w-6 h-6 mr-3" />
              <span>Failed to load announcements</span>
              <button
                onClick={refreshAnnouncements}
                className="ml-4 text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                aria-label="Retry loading announcements"
              >
                Retry
              </button>
            </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-primary-600 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed" style={{ fontSize: '14px' }}>
                      {announcement.message}
                    </p>
                    {announcement.malayalamMessage && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed" lang="ml" style={{ fontSize: '14px' }}>
                        {announcement.malayalamMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500" style={{ fontSize: '14px' }}>No announcements at this time</p>
          )}
        </div>

        {/* Desktop WhatsApp Button */}
        <WhatsAppButton
          teacherNumber="+918078769771"
          message="السلام عليكم"
          position="bottom-right"
          showLabel={true}
          malayalamLabel="അധ്യാപകനെ ചോദിക്കുക"
        />
      </div>
    </Layout>
  );
};