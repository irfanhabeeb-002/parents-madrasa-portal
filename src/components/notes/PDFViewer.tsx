import React from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import type { Note } from '../../types/note';

interface PDFViewerProps {
  note: Note;
  onClose: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ note, onClose }) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
          <p className="text-sm text-gray-600">{note.subject}</p>
        </div>
      </div>

      {/* PDF Content */}
      {note.pdfUrl ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <iframe
            src={note.pdfUrl}
            className="w-full h-96"
            title={`PDF viewer for ${note.title}`}
          />
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-gray-600">PDF not available</p>
          <p className="text-sm text-gray-500 mt-1" lang="ml">
            PDF ലഭ്യമല്ല
          </p>
        </div>
      )}

      {/* Note Content */}
      {note.content && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
          <p className="text-gray-700 text-sm">{note.content}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span>Views: {note.viewCount || 0}</span>
          <span className="mx-2">•</span>
          <span>Difficulty: {note.difficulty}</span>
        </div>

        <AccessibleButton variant="secondary" onClick={onClose}>
          Close
        </AccessibleButton>
      </div>
    </div>
  );
};
