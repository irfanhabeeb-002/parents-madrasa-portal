import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { 
  VideoCameraIcon, 
  PlayIcon, 
  DocumentTextIcon, 
  AcademicCapIcon,
  ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Sample announcements data - will be replaced with real data in task 4.2
  const announcements = [
    "New Arabic lesson recordings available",
    "Exam scheduled for next Friday at 2 PM",
    "Holiday notice: No classes on Thursday",
    "New exercise materials uploaded for Quran studies"
  ];

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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Announcements
            <span className="block text-sm text-gray-500 font-normal" lang="bn">
              ঘোষণা
            </span>
          </h2>
          
          <div className="relative overflow-hidden">
            <div className="animate-scroll">
              <div className="flex space-x-8 whitespace-nowrap">
                {announcements.map((announcement, index) => (
                  <span
                    key={index}
                    className="text-gray-700 text-sm inline-block"
                    role="marquee"
                    aria-label={`Announcement ${index + 1}: ${announcement}`}
                  >
                    • {announcement}
                  </span>
                ))}
              </div>
            </div>
          </div>
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