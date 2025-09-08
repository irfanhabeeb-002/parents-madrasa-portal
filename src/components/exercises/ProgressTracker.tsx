import React from 'react';

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  className?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  className = ''
}) => {
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className={`space-y-3 ${className}`} role="progressbar" aria-valuenow={completedSteps} aria-valuemin={0} aria-valuemax={totalSteps}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step Information */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">
          Step {currentStep} of {totalSteps}
          <span className="block text-xs text-gray-500 mt-1" lang="ml">
            ഘട്ടം {currentStep} / {totalSteps}
          </span>
        </span>

        <span className="text-gray-600">
          {completedSteps} completed
          <span className="block text-xs text-gray-500 mt-1" lang="ml">
            {completedSteps} പൂർത്തിയായി
          </span>
        </span>
      </div>

      {/* Visual Step Indicators */}
      <div className="flex justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber <= completedSteps;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={stepNumber}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-200 ${isCompleted
                ? 'bg-success-600 text-white'
                : isCurrent
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
                }`}
              aria-label={`Step ${stepNumber}${isCompleted ? ' completed' : isCurrent ? ' current' : ''}`}
            >
              {isCompleted ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                stepNumber
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};