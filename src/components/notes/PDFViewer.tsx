import React, { useState, useEffect } from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import { AlertBanner } from '../ui/AlertBanner';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import type { Note } from '../../types/note';

interface PDFViewerProps {
  note: Note;
  onClose: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ note, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    // Simulate PDF loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    if (note.pdfUrl) {
      // In a real implementation, this would trigger a download
      const link = document.createElement('a');
      link.href = note.pdfUrl;
      link.download = `${note.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    const maxPages = note.pageCount || 10;
    setCurrentPage(prev => Math.min(prev + 1, maxPages));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <SkeletonLoader variant="text" width="200px" />
          <div className="flex space-x-2">
            <SkeletonLoader variant="button" />
            <SkeletonLoader variant="button" />
          </div>
        </div>
        <SkeletonLoader variant="custom" height="400px" className="w-full bg-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <AlertBanner
          type="error"
          message={error}
          malayalamMessage="PDF ലോഡ് ചെയ്യുന്നതിൽ പിശക്"
        />
        <div className="text-center py-8">
          <AccessibleButton
            variant="primary"
            onClick={() => setError(null)}
          >
            Try Again
          </AccessibleButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PDF Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            ariaLabel="Previous page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </AccessibleButton>
          
          <span className="text-sm text-gray-600 px-2">
            Page {currentPage} of {note.pageCount || 10}
          </span>
          
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === (note.pageCount || 10)}
            ariaLabel="Next page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </AccessibleButton>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            ariaLabel="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </AccessibleButton>
          
          <span className="text-sm text-gray-600 px-2 min-w-[60px] text-center">
            {zoom}%
          </span>
          
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            ariaLabel="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </AccessibleButton>
          
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={handleResetZoom}
            ariaLabel="Reset zoom"
          >
            Reset
          </AccessibleButton>
        </div>

        {/* Download Button */}
        <AccessibleButton
          variant="primary"
          size="sm"
          onClick={handleDownload}
          ariaLabel="Download PDF"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download
        </AccessibleButton>
      </div>

      {/* PDF Content Area */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className="bg-white p-4 overflow-auto max-h-[500px]"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
        >
          {/* Mock PDF Content - In real implementation, this would be a PDF.js viewer */}
          <div className="bg-white shadow-lg mx-auto" style={{ width: '8.5in', minHeight: '11in' }}>
            <div className="p-8 space-y-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {note.title}
              </h1>
              
              <div className="prose prose-sm max-w-none">
                {note.content.split('\n').map((paragraph, index) => {
                  if (paragraph.startsWith('#')) {
                    const level = paragraph.match(/^#+/)?.[0].length || 1;
                    const text = paragraph.replace(/^#+\s*/, '');
                    const headingLevel = Math.min(level, 6);
                    
                    if (headingLevel === 1) {
                      return <h1 key={index} className="font-semibold text-gray-900 mt-6 mb-3">{text}</h1>;
                    } else if (headingLevel === 2) {
                      return <h2 key={index} className="font-semibold text-gray-900 mt-6 mb-3">{text}</h2>;
                    } else if (headingLevel === 3) {
                      return <h3 key={index} className="font-semibold text-gray-900 mt-6 mb-3">{text}</h3>;
                    } else if (headingLevel === 4) {
                      return <h4 key={index} className="font-semibold text-gray-900 mt-6 mb-3">{text}</h4>;
                    } else if (headingLevel === 5) {
                      return <h5 key={index} className="font-semibold text-gray-900 mt-6 mb-3">{text}</h5>;
                    } else {
                      return <h6 key={index} className="font-semibold text-gray-900 mt-6 mb-3">{text}</h6>;
                    }
                  } else if (paragraph.startsWith('- ')) {
                    return (
                      <li key={index} className="ml-4 text-gray-700">
                        {paragraph.replace(/^-\s*/, '')}
                      </li>
                    );
                  } else if (paragraph.trim()) {
                    return (
                      <p key={index} className="text-gray-700 leading-relaxed mb-3">
                        {paragraph}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Note Metadata */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Author:</strong> {note.author}
                  </div>
                  <div>
                    <strong>Subject:</strong> {note.subject}
                  </div>
                  <div>
                    <strong>Difficulty:</strong> {note.difficulty}
                  </div>
                  <div>
                    <strong>Language:</strong> {note.language === 'both' ? 'English & Malayalam' : note.language}
                  </div>
                </div>
                
                {note.tags.length > 0 && (
                  <div className="mt-4">
                    <strong className="text-sm text-gray-600">Tags:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Information */}
      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        <p>
          <strong>Accessibility:</strong> Use arrow keys to navigate pages, +/- keys to zoom.
          Screen reader users can access the content above.
        </p>
        <p lang="ml" className="mt-1">
          <strong>പ്രവേശനക്ഷമത:</strong> പേജുകൾ നാവിഗേറ്റ് ചെയ്യാൻ ആരോ കീകൾ ഉപയോഗിക്കുക, സൂം ചെയ്യാൻ +/- കീകൾ.
        </p>
      </div>
    </div>
  );
};