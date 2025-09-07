import React, { useState } from 'react';
import { 
  AccessibleButton, 
  Card, 
  Modal, 
  AlertBanner, 
  SkeletonLoader,
  DashboardSkeleton 
} from './index';

// Demo component to test all UI components
export const ComponentDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleButtonClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowAlert(true);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">UI Components Demo</h1>
      
      {/* Alert Banner Demo */}
      {showAlert && (
        <AlertBanner
          type="success"
          message="Component test completed successfully!"
          malayalamMessage="কম্পোনেন্ট পরীক্ষা সফলভাবে সম্পন্ন হয়েছে!"
          onDismiss={() => setShowAlert(false)}
          autoHide
          duration={5000}
        />
      )}

      {/* Accessible Button Demo */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Accessible Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <AccessibleButton
            variant="primary"
            onClick={handleButtonClick}
            loading={loading}
            malayalamLabel="প্রাথমিক বোতাম"
          >
            Primary Button
          </AccessibleButton>
          
          <AccessibleButton
            variant="secondary"
            onClick={() => setShowModal(true)}
            malayalamLabel="মোডাল খুলুন"
          >
            Open Modal
          </AccessibleButton>
          
          <AccessibleButton
            variant="success"
            size="lg"
            malayalamLabel="সফল"
          >
            Success Large
          </AccessibleButton>
          
          <AccessibleButton
            variant="error"
            size="sm"
            malayalamLabel="ত্রুটি"
          >
            Error Small
          </AccessibleButton>
        </div>
      </section>

      {/* Card Demo */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            title="Live Class"
            subtitle="Join your scheduled class"
            malayalamSubtitle="আপনার নির্ধারিত ক্লাসে যোগ দিন"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            }
            onClick={() => alert('Live Class clicked!')}
            variant="interactive"
            ariaLabel="Join live class session"
          />
          
          <Card
            title="Recordings"
            subtitle="Watch past sessions"
            malayalamSubtitle="পূর্ববর্তী সেশন দেখুন"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            }
            onClick={() => alert('Recordings clicked!')}
            variant="interactive"
          />
          
          <Card
            title="Notes & Exercises"
            subtitle="Study materials"
            malayalamSubtitle="অধ্যয়ন উপকরণ"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h4a2 2 0 002-2V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            }
            variant="elevated"
          />
        </div>
      </section>

      {/* Skeleton Loader Demo */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Skeleton Loaders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">Individual Skeletons</h3>
            <SkeletonLoader variant="text" />
            <SkeletonLoader variant="text" lines={3} />
            <SkeletonLoader variant="button" />
            <SkeletonLoader variant="avatar" />
            <SkeletonLoader variant="image" height="120px" />
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Dashboard Skeleton</h3>
            <DashboardSkeleton />
          </div>
        </div>
      </section>

      {/* Modal Demo */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Demo Modal"
        malayalamTitle="ডেমো মোডাল"
        size="md"
        ariaDescribedBy="modal-description"
      >
        <div id="modal-description">
          <p className="mb-4">
            This is a demo modal with proper focus management and accessibility features.
          </p>
          <p className="text-sm text-gray-600 mb-4" lang="bn">
            এটি সঠিক ফোকাস ব্যবস্থাপনা এবং অ্যাক্সেসিবিলিটি বৈশিষ্ট্য সহ একটি ডেমো মোডাল।
          </p>
          
          <div className="flex justify-end space-x-3">
            <AccessibleButton
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </AccessibleButton>
            <AccessibleButton
              variant="primary"
              onClick={() => {
                alert('Confirmed!');
                setShowModal(false);
              }}
            >
              Confirm
            </AccessibleButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};