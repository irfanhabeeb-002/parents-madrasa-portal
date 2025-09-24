import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  ariaLabel?: string;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
  ariaLabel = 'Progress indicator',
  className = '',
}) => {
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <div
      className={`w-full ${className}`}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
    >
      {/* Step counter text */}
      <div className="text-center mb-4">
        <span className="text-lg font-semibold text-primary-700">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-600 ml-2" lang="ml">
          ഘട്ടം {currentStep} / {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isUpcoming = step > currentStep;

          return (
            <div key={step} className="flex flex-col items-center">
              {/* Step circle */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-success-600 text-white'
                      : isCurrent
                        ? 'bg-primary-600 text-white ring-4 ring-primary-200'
                        : 'bg-gray-300 text-gray-600'
                  }
                `}
                aria-label={`Step ${step}${isCompleted ? ' completed' : isCurrent ? ' current' : ' upcoming'}`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step
                )}
              </div>

              {/* Step label */}
              {stepLabels && stepLabels[index] && (
                <span
                  className={`
                    text-xs mt-2 text-center max-w-16 leading-tight
                    ${isCurrent ? 'text-primary-700 font-medium' : 'text-gray-600'}
                  `}
                >
                  {stepLabels[index]}
                </span>
              )}

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    absolute h-0.5 w-full transform translate-x-4 -translate-y-4
                    ${isCompleted ? 'bg-success-600' : 'bg-gray-300'}
                  `}
                  style={{
                    left: '50%',
                    width: `calc(100% / ${totalSteps} - 2rem)`,
                    zIndex: -1,
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
