import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { NotificationBanner } from '../components/ui/NotificationBanner';
import { useDashboard } from '../hooks/useDashboard';
import { 
  VideoCameraIcon, 
  PlayIcon, 
  DocumentTextIcon, 
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    announcements,
    notifications,
    todaysClass,
    loading,
    error,
    refreshAnnouncements,
    refreshNotifications,
    refreshTodaysClass,
    clearError
  } = useDashboard();

  // Get unread notifications for banner display
  const unreadNotifications = useMemo(() => 
    notifications.filter(notification => !notification.read),
    [notifications]
  );

  // Format today's class time
  const todaysClassTime = useMemo(() => {
    if (!todaysClass) return null;
    return todaysClass.scheduledAt.toDate().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, [todaysClass]);

  const navigationCards = [
    {
      title: "Live Class",
      malayalamSubtitle: "লাইভ ক্লাস",
      icon: <VideoCameraIcon className="w-8 h-8" />,
      onClick: () => navigate('/live-class'),
      ariaLabel: "Join live class session"
    },
    {
      title: "Recordings",
      malayalamSubtitle: "রেকর্ডিং",
      icon: <PlayIcon className="w-8 h-8" />,
      onClick: () => navigate('/recordings'),
      ariaLabel: "View recorded class sessions"
    },
    {
      title: "Notes/Exercises",
      malayalamSubtitle: "নোট এবং অনুশীলন",
      icon: <DocumentTextIcon className="w-8 h-8" />,
      onClick: () => navigate('/notes-exercises'),
      ariaLabel: "Access lesson notes and practice exercises"
    },
    {
      title: "Exams/Attendance",
      malayalamSubtitle: "পরীক্ষা এবং উপস্থিতি",
      icon: <AcademicCapIcon className="w-8 h-8" />,
      onClick: () => navigate('/exams-attendance'),
      ariaLabel: "View exams and attendance records"
    }
  ];

  const handleWhatsAppClick = () => {
    // WhatsApp link - replace with actual teacher's number
    const phoneNumber = "+1234567890"; // This should come from config
    const message = encodeURIComponent("Assalamu Alaikum, I need help with my studies.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600" lang="bn">
            আপনার ড্যাশবোর্ডে স্বাগতম
          </p>
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
          <NotificationBanner
            type="info"
            title={`Your class today at ${todaysClassTime}`}
            message={todaysClass.title}
            malayalamMessage={`আজ ${todaysClassTime} এ আপনার ক্লাস`}
          />
        ) : null}

        {/* Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <NotificationBanner
            type="success"
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
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Announcements
              <span className="block text-sm text-gray-500 font-normal" lang="bn">
                ঘোষণা
              </span>
            </h2>
            
            {error.announcements && (
              <button
                onClick={refreshAnnouncements}
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                aria-label="Retry loading announcements"
              >
                Retry
              </button>
            )}
          </div>
          
          {loading.announcements ? (
            <SkeletonLoader className="h-8" />
          ) : error.announcements ? (
            <div className="flex items-center text-red-600 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
              <span>Failed to load announcements</span>
            </div>
          ) : announcements.length > 0 ? (
            <div className="relative overflow-hidden">
              <div className="animate-scroll">
                <div className="flex space-x-8 whitespace-nowrap">
                  {announcements.map((announcement, index) => (
                    <span
                      key={announcement.id}
                      className="text-gray-700 text-sm inline-block"
                      role="marquee"
                      aria-label={`Announcement ${index + 1}: ${announcement.message}`}
                    >
                      • {announcement.message}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No announcements at this time</p>
          )}
        </div>

        {/* Floating WhatsApp Button */}
        <button
          onClick={handleWhatsAppClick}
          className="fixed bottom-24 right-4 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-50 touch-target focus-visible"
          aria-label="Ask teacher on WhatsApp"
          title="Ask Teacher"
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
          <span className="sr-only">Contact teacher via WhatsApp</span>
        </button>
      </div>
    </Layout>
  );
};