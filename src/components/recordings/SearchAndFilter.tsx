import React, { useState, useCallback, useRef } from 'react';
import { VideoQuality } from '../../types/recording';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface SearchAndFilterProps {
  searchQuery: string;
  selectedQuality: VideoQuality | 'all';
  onSearch: (query: string) => void;
  onQualityFilter: (quality: VideoQuality | 'all') => void;
  disabled?: boolean;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  selectedQuality,
  onSearch,
  onQualityFilter,
  disabled = false,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  }, [localSearchQuery, onSearch]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    
    // Auto-search after a short delay for better UX
    if (value.length === 0) {
      onSearch('');
    }
  }, [onSearch]);

  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery('');
    onSearch('');
    searchInputRef.current?.focus();
  }, [onSearch]);

  const handleQualityChange = useCallback((quality: VideoQuality | 'all') => {
    onQualityFilter(quality);
  }, [onQualityFilter]);

  const qualityOptions: Array<{ value: VideoQuality | 'all'; label: string; malayalamLabel: string }> = [
    { value: 'all', label: 'All Qualities', malayalamLabel: 'എല്ലാ ഗുണനിലവാരങ്ങളും' },
    { value: 'hd', label: 'HD Quality', malayalamLabel: 'എച്ച്ഡി ഗുണനിലവാരം' },
    { value: 'high', label: 'High Quality', malayalamLabel: 'ഉയർന്ന ഗുണനിലവാരം' },
    { value: 'medium', label: 'Medium Quality', malayalamLabel: 'ഇടത്തരം ഗുണനിലവാരം' },
    { value: 'low', label: 'Low Quality', malayalamLabel: 'കുറഞ്ഞ ഗുണനിലവാരം' },
  ];

  const activeFiltersCount = selectedQuality !== 'all' ? 1 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <input
            ref={searchInputRef}
            type="text"
            value={localSearchQuery}
            onChange={handleSearchChange}
            disabled={disabled}
            placeholder="Search recordings..."
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500 text-base"
            aria-label="Search recordings"
          />
          
          {localSearchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              disabled={disabled}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 disabled:opacity-50"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
        
        {/* Malayalam placeholder text */}
        <p className="text-xs text-gray-500 mt-1" lang="ml">
          റെക്കോർഡിംഗുകൾ തിരയുക...
        </p>
      </form>

      {/* Filter Toggle and Active Filters */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          disabled={disabled}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <FunnelIcon className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-800">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Active filter indicators */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            {selectedQuality !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {selectedQuality.toUpperCase()}
                <button
                  type="button"
                  onClick={() => handleQualityChange('all')}
                  className="ml-1 hover:text-blue-600"
                  aria-label="Remove quality filter"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div 
          id="filter-panel"
          className="border-t border-gray-200 pt-4 space-y-4"
          role="region"
          aria-label="Filter options"
        >
          {/* Quality Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Quality
              <span className="block text-xs text-gray-500 font-normal" lang="ml">
                വീഡിയോ ഗുണനിലവാരം
              </span>
            </label>
            
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {qualityOptions.map((option) => (
                <label
                  key={option.value}
                  className="relative flex items-center cursor-pointer"
                >
                  <input
                    type="radio"
                    name="quality"
                    value={option.value}
                    checked={selectedQuality === option.value}
                    onChange={() => handleQualityChange(option.value)}
                    disabled={disabled}
                    className="sr-only"
                  />
                  <div className={`
                    flex-1 px-3 py-2 text-sm text-center border rounded-md transition-colors duration-200
                    ${selectedQuality === option.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500" lang="ml">
                      {option.malayalamLabel}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Clear All Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleQualityChange('all')}
                disabled={disabled}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};