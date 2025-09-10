import React, { useState, useCallback } from 'react';
import { Modal, AccessibleButton, AlertBanner } from '../ui';
import { RecordingService } from '../../services/recordingService';
import { Recording } from '../../types/recording';
import { ApiResponse } from '../../types/common';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ManualUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (recording: Recording) => void;
  classSessionId?: string;
}

interface UploadState {
  file: File | null;
  title: string;
  description: string;
  tags: string[];
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export const ManualUpload: React.FC<ManualUploadProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  classSessionId = ''
}) => {
  const [state, setState] = useState<UploadState>({
    file: null,
    title: '',
    description: '',
    tags: [],
    uploading: false,
    progress: 0,
    error: null,
    success: false
  });

  const [tagInput, setTagInput] = useState('');

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const validExtensions = ['.mp4', '.webm', '.mov'];
      
      const isValidType = validTypes.includes(file.type) || 
                         validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

      if (!isValidType) {
        setState(prev => ({
          ...prev,
          error: 'Please select a valid video file (MP4, WebM, or MOV)',
          file: null
        }));
        return;
      }

      // Check file size (limit to 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        setState(prev => ({
          ...prev,
          error: 'File size must be less than 500MB',
          file: null
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        file,
        error: null,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '') // Use filename as default title
      }));
    }
  }, []);

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !state.tags.includes(tag)) {
      setState(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  }, [tagInput, state.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const handleUpload = useCallback(async () => {
    if (!state.file || !state.title.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Please select a file and enter a title'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      uploading: true,
      progress: 0,
      error: null
    }));

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const response: ApiResponse<Recording> = await RecordingService.uploadManualRecording(
        state.file,
        {
          title: state.title.trim(),
          description: state.description.trim(),
          classSessionId: classSessionId,
          tags: state.tags
        }
      );

      clearInterval(progressInterval);

      if (response.success) {
        setState(prev => ({
          ...prev,
          progress: 100,
          success: true,
          uploading: false
        }));

        // Call success callback
        onUploadSuccess(response.data);

        // Close modal after a short delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setState(prev => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: response.error || 'Upload failed'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
    }
  }, [state.file, state.title, state.description, state.tags, classSessionId, onUploadSuccess]);

  const handleClose = useCallback(() => {
    if (!state.uploading) {
      setState({
        file: null,
        title: '',
        description: '',
        tags: [],
        uploading: false,
        progress: 0,
        error: null,
        success: false
      });
      setTagInput('');
      onClose();
    }
  }, [state.uploading, onClose]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Recording"
      size="lg"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {state.success && (
          <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
            <CheckCircleIcon className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-green-800 font-medium">Upload Successful!</p>
              <p className="text-green-600 text-sm" lang="ml">
                അപ്‌ലോഡ് വിജയകരമായി പൂർത്തിയായി
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {state.error && (
          <AlertBanner
            type="error"
            message={state.error}
            malayalamMessage="ഒരു പിശക് സംഭവിച്ചു"
            onDismiss={() => setState(prev => ({ ...prev, error: null }))}
          />
        )}

        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video File
            <span className="block text-xs text-gray-500 mt-1" lang="ml">
              വീഡിയോ ഫയൽ
            </span>
          </label>
          
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              {state.file ? (
                <div className="flex items-center space-x-3">
                  <DocumentIcon className="w-8 h-8 text-blue-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{state.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(state.file.size)}</p>
                  </div>
                  <button
                    onClick={() => setState(prev => ({ ...prev, file: null }))}
                    className="text-red-500 hover:text-red-700"
                    disabled={state.uploading}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        onChange={handleFileSelect}
                        disabled={state.uploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">MP4, WebM, MOV up to 500MB</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {state.uploading && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{state.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
            <span className="block text-xs text-gray-500" lang="ml">
              ശീർഷകം
            </span>
          </label>
          <input
            type="text"
            id="title"
            value={state.title}
            onChange={(e) => setState(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter recording title"
            disabled={state.uploading}
            required
          />
        </div>

        {/* Description Input */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
            <span className="block text-xs text-gray-500" lang="ml">
              വിവരണം
            </span>
          </label>
          <textarea
            id="description"
            rows={3}
            value={state.description}
            onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter recording description (optional)"
            disabled={state.uploading}
          />
        </div>

        {/* Tags Input */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
            <span className="block text-xs text-gray-500" lang="ml">
              ടാഗുകൾ
            </span>
          </label>
          
          {/* Existing Tags */}
          {state.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {state.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                    disabled={state.uploading}
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag Input */}
          <div className="flex">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-gray-300 rounded-l-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Add tags (press Enter)"
              disabled={state.uploading}
            />
            <AccessibleButton
              variant="secondary"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || state.uploading}
              className="rounded-l-none border-l-0"
              ariaLabel="Add tag"
            >
              Add
            </AccessibleButton>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <AccessibleButton
            variant="secondary"
            onClick={handleClose}
            disabled={state.uploading}
            ariaLabel="Cancel upload"
          >
            Cancel
          </AccessibleButton>
          <AccessibleButton
            variant="primary"
            onClick={handleUpload}
            disabled={!state.file || !state.title.trim() || state.uploading}
            ariaLabel="Upload recording"
          >
            {state.uploading ? 'Uploading...' : 'Upload'}
          </AccessibleButton>
        </div>
      </div>
    </Modal>
  );
};