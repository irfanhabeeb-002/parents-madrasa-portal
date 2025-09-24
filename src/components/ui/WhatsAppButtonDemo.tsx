import React from 'react';
import { WhatsAppButton, MESSAGE_TEMPLATES } from './WhatsAppButton';

/**
 * Demo component showcasing different WhatsApp button configurations
 * This demonstrates all the features implemented in the WhatsAppButton component
 */
export const WhatsAppButtonDemo: React.FC = () => {
  const teacherNumber = '+918078769771';

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          WhatsApp Button Component Demo
        </h1>
        <p className="text-gray-600 mb-8">
          Demonstrating the WhatsApp integration component with different
          contexts and configurations
        </p>

        {/* Context-based Message Templates */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Message Templates by Context
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(MESSAGE_TEMPLATES).map(([context, message]) => (
              <div key={context} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 capitalize mb-2">
                  {context.replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-600 mb-3">"{message}"</p>
                <WhatsAppButton
                  teacherNumber={teacherNumber}
                  context={context as keyof typeof MESSAGE_TEMPLATES}
                  position="bottom-right"
                  className="relative bottom-auto right-auto"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Custom Message */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Custom Message
          </h2>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">
              Custom Help Request
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              "السلام عليكم، أحتاج مساعدة في فهم درس اليوم حول التاريخ
              الإسلامي."
            </p>
            <WhatsAppButton
              teacherNumber={teacherNumber}
              message="السلام عليكم، أحتاج مساعدة في فهم درس اليوم حول التاريخ الإسلامي."
              position="bottom-right"
              className="relative bottom-auto right-auto"
            />
          </div>
        </section>

        {/* Position Variants */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Position Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Bottom Right</h3>
              <div className="relative h-32 bg-gray-100 rounded">
                <WhatsAppButton
                  teacherNumber={teacherNumber}
                  context="general"
                  position="bottom-right"
                  className="absolute"
                />
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Bottom Left</h3>
              <div className="relative h-32 bg-gray-100 rounded">
                <WhatsAppButton
                  teacherNumber={teacherNumber}
                  context="general"
                  position="bottom-left"
                  className="absolute"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Label Variants */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Label Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                With Hover Label
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Hover to see the label
              </p>
              <WhatsAppButton
                teacherNumber={teacherNumber}
                context="class_help"
                position="bottom-right"
                showLabel={true}
                malayalamLabel="ക്ലാസ് സഹായം"
                className="relative bottom-auto right-auto"
              />
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Without Label</h3>
              <p className="text-sm text-gray-600 mb-3">No hover label shown</p>
              <WhatsAppButton
                teacherNumber={teacherNumber}
                context="class_help"
                position="bottom-right"
                showLabel={false}
                className="relative bottom-auto right-auto"
              />
            </div>
          </div>
        </section>

        {/* Accessibility Features */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Accessibility Features
          </h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                Keyboard Navigation
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Try tabbing to the button and pressing Enter or Space
              </p>
              <WhatsAppButton
                teacherNumber={teacherNumber}
                context="technical_support"
                position="bottom-right"
                ariaLabel="Get technical support from teacher via WhatsApp"
                className="relative bottom-auto right-auto"
              />
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                Screen Reader Support
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Includes comprehensive ARIA labels and screen reader text
              </p>
              <WhatsAppButton
                teacherNumber={teacherNumber}
                context="homework_help"
                position="bottom-right"
                malayalamLabel="ഗൃഹപാഠ സഹായം"
                className="relative bottom-auto right-auto"
              />
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                Touch Target Size
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Minimum 44px touch target for mobile accessibility
              </p>
              <WhatsAppButton
                teacherNumber={teacherNumber}
                context="exam_query"
                position="bottom-right"
                className="relative bottom-auto right-auto"
              />
            </div>
          </div>
        </section>

        {/* Implementation Notes */}
        <section className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Implementation Features
          </h2>
          <ul className="space-y-2 text-blue-800">
            <li>✅ 44px minimum touch target size for accessibility</li>
            <li>✅ Thumb-zone positioning (bottom-right/bottom-left)</li>
            <li>✅ Deep linking to WhatsApp with pre-filled messages</li>
            <li>✅ Context-specific message templates</li>
            <li>✅ Malayalam language support</li>
            <li>✅ Comprehensive ARIA labels and screen reader support</li>
            <li>✅ Keyboard navigation (Enter/Space keys)</li>
            <li>✅ Focus management and visual focus indicators</li>
            <li>✅ Hover/focus tooltips with bilingual text</li>
            <li>✅ Pulse animation for attention</li>
            <li>✅ Responsive design (mobile-first)</li>
            <li>✅ Customizable positioning and styling</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
