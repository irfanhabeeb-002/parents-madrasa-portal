import { ApiResponse, SearchOptions, PaginationOptions } from '../types/common';
import { Recording } from '../types/recording';
import { Note } from '../types/note';
import { Exercise } from '../types/exercise';
import { _Attendance } from '../types/attendance';
import { StorageService } from './storageService';

// Search result interface
interface SearchResult<T> {
  items: T[];
  totalCount: number;
  searchTime: number;
  suggestions: string[];
  facets: SearchFacet[];
}

interface SearchFacet {
  field: string;
  values: { value: string; count: number }[];
}

interface AdvancedSearchOptions extends SearchOptions {
  filters?: Record<string, any>;
  facets?: string[];
  highlight?: boolean;
  fuzzy?: boolean;
  boost?: Record<string, number>; // Field boosting for relevance
}

/**
 * Advanced Search Service with filtering, sorting, and full-text search capabilities
 */
export class SearchService {
  // Search across all collections
  static async globalSearch(
    query: string,
    options?: AdvancedSearchOptions & PaginationOptions
  ): Promise<
    ApiResponse<{
      recordings: SearchResult<Recording>;
      notes: SearchResult<Note>;
      exercises: SearchResult<Exercise>;
      totalResults: number;
    }>
  > {
    try {
      const _startTime = Date.now();

      // Search each collection
      const [recordingsResult, notesResult, exercisesResult] =
        await Promise.all([
          this.searchRecordings(query, options),
          this.searchNotes(query, options),
          this.searchExercises(query, options),
        ]);

      const totalResults =
        recordingsResult.data.totalCount +
        notesResult.data.totalCount +
        exercisesResult.data.totalCount;

      return {
        data: {
          recordings: recordingsResult.data,
          notes: notesResult.data,
          exercises: exercisesResult.data,
          totalResults,
        },
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {
          recordings: {
            items: [],
            totalCount: 0,
            searchTime: 0,
            suggestions: [],
            facets: [],
          },
          notes: {
            items: [],
            totalCount: 0,
            searchTime: 0,
            suggestions: [],
            facets: [],
          },
          exercises: {
            items: [],
            totalCount: 0,
            searchTime: 0,
            suggestions: [],
            facets: [],
          },
          totalResults: 0,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Global search failed',
        timestamp: new Date(),
      };
    }
  }

  // Search recordings with advanced options
  static async searchRecordings(
    query: string,
    options?: AdvancedSearchOptions & PaginationOptions
  ): Promise<ApiResponse<SearchResult<Recording>>> {
    try {
      const _startTime = Date.now();
      const recordings = StorageService.getArray<Recording>('recordings');

      // Apply search
      const results = this.performSearch(recordings, query, {
        fields: options?.fields || ['title', 'description', 'tags'],
        caseSensitive: options?.caseSensitive || false,
        fuzzy: options?.fuzzy || false,
        boost: options?.boost || { title: 2, tags: 1.5, description: 1 },
      });

      // Apply filters
      if (options?.filters) {
        results = this.applyFilters(results, options.filters);
      }

      // Calculate facets
      const facets = options?.facets
        ? this.calculateFacets(results, options.facets)
        : [];

      // Apply sorting and pagination
      const totalCount = results.length;
      results = this.applySortingAndPagination(results, options);

      const searchTime = Date.now() - startTime;
      const suggestions = this.generateSuggestions(query, recordings, [
        'title',
        'description',
      ]);

      return {
        data: {
          items: results,
          totalCount,
          searchTime,
          suggestions,
          facets,
        },
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {
          items: [],
          totalCount: 0,
          searchTime: 0,
          suggestions: [],
          facets: [],
        },
        success: false,
        error:
          error instanceof Error ? error.message : 'Recording search failed',
        timestamp: new Date(),
      };
    }
  }

  // Search notes with advanced options
  static async searchNotes(
    query: string,
    options?: AdvancedSearchOptions & PaginationOptions
  ): Promise<ApiResponse<SearchResult<Note>>> {
    try {
      const _startTime = Date.now();
      const notes = StorageService.getArray<Note>('notes');

      // Apply search
      const results = this.performSearch(notes, query, {
        fields: options?.fields || [
          'title',
          'content',
          'summary',
          'tags',
          'subject',
        ],
        caseSensitive: options?.caseSensitive || false,
        fuzzy: options?.fuzzy || false,
        boost: options?.boost || {
          title: 3,
          summary: 2,
          tags: 1.5,
          content: 1,
          subject: 1.5,
        },
      });

      // Apply filters
      if (options?.filters) {
        results = this.applyFilters(results, options.filters);
      }

      // Calculate facets
      const facets = options?.facets
        ? this.calculateFacets(results, options.facets)
        : [];

      // Apply sorting and pagination
      const totalCount = results.length;
      results = this.applySortingAndPagination(results, options);

      const searchTime = Date.now() - startTime;
      const suggestions = this.generateSuggestions(query, notes, [
        'title',
        'content',
        'summary',
      ]);

      return {
        data: {
          items: results,
          totalCount,
          searchTime,
          suggestions,
          facets,
        },
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {
          items: [],
          totalCount: 0,
          searchTime: 0,
          suggestions: [],
          facets: [],
        },
        success: false,
        error: error instanceof Error ? error.message : 'Note search failed',
        timestamp: new Date(),
      };
    }
  }

  // Search exercises with advanced options
  static async searchExercises(
    query: string,
    options?: AdvancedSearchOptions & PaginationOptions
  ): Promise<ApiResponse<SearchResult<Exercise>>> {
    try {
      const _startTime = Date.now();
      const exercises = StorageService.getArray<Exercise>('exercises');

      // Apply search
      const results = this.performSearch(exercises, query, {
        fields: options?.fields || ['title', 'description', 'tags'],
        caseSensitive: options?.caseSensitive || false,
        fuzzy: options?.fuzzy || false,
        boost: options?.boost || { title: 2, tags: 1.5, description: 1 },
      });

      // Apply filters
      if (options?.filters) {
        results = this.applyFilters(results, options.filters);
      }

      // Calculate facets
      const facets = options?.facets
        ? this.calculateFacets(results, options.facets)
        : [];

      // Apply sorting and pagination
      const totalCount = results.length;
      results = this.applySortingAndPagination(results, options);

      const searchTime = Date.now() - startTime;
      const suggestions = this.generateSuggestions(query, exercises, [
        'title',
        'description',
      ]);

      return {
        data: {
          items: results,
          totalCount,
          searchTime,
          suggestions,
          facets,
        },
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {
          items: [],
          totalCount: 0,
          searchTime: 0,
          suggestions: [],
          facets: [],
        },
        success: false,
        error:
          error instanceof Error ? error.message : 'Exercise search failed',
        timestamp: new Date(),
      };
    }
  }

  // Perform search with scoring and relevance
  private static performSearch<T extends Record<string, any>>(
    items: T[],
    query: string,
    options: {
      fields: string[];
      caseSensitive: boolean;
      fuzzy: boolean;
      boost: Record<string, number>;
    }
  ): T[] {
    if (!query.trim()) return items;

    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 0);

    const scoredItems = items.map(item => {
      const score = 0;
      const matchedFields: string[] = [];

      options.fields.forEach(field => {
        const fieldValue = this.getFieldValue(item, field);
        if (!fieldValue) return;

        const fieldText = options.caseSensitive
          ? fieldValue
          : fieldValue.toLowerCase();
        const boost = options.boost[field] || 1;

        searchTerms.forEach(term => {
          // Exact match
          if (fieldText.includes(term)) {
            score += 10 * boost;
            matchedFields.push(field);
          }

          // Fuzzy match (simple implementation)
          if (options.fuzzy && this.fuzzyMatch(fieldText, term)) {
            score += 5 * boost;
          }

          // Word boundary match
          const wordBoundaryRegex = new RegExp(
            `\\b${this.escapeRegex(term)}`,
            'i'
          );
          if (wordBoundaryRegex.test(fieldText)) {
            score += 15 * boost;
          }
        });

        // Bonus for multiple term matches in same field
        const termMatches = searchTerms.filter(term =>
          fieldText.includes(term)
        ).length;
        if (termMatches > 1) {
          score += termMatches * 5 * boost;
        }
      });

      return {
        item,
        score,
        matchedFields: [...new Set(matchedFields)],
      };
    });

    // Filter items with score > 0 and sort by score
    return scoredItems
      .filter(scored => scored.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(scored => scored.item);
  }

  // Get field value (supports nested fields)
  private static getFieldValue(item: any, field: string): string {
    const keys = field.split('.');
    const value = item;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) return '';
    }

    if (Array.isArray(value)) {
      return value.join(' ');
    }

    return String(value);
  }

  // Simple fuzzy matching
  private static fuzzyMatch(text: string, term: string): boolean {
    if (term.length < 3) return false; // Skip fuzzy for short terms

    // Allow 1 character difference for terms 3-5 chars, 2 for longer
    const maxDistance = term.length <= 5 ? 1 : 2;
    return this.levenshteinDistance(text, term) <= maxDistance;
  }

  // Levenshtein distance calculation
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (const i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (const j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (const j = 1; j <= str2.length; j++) {
      for (const i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Escape regex special characters
  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Apply filters to results
  private static applyFilters<T extends Record<string, any>>(
    items: T[],
    filters: Record<string, any>
  ): T[] {
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true;

        const itemValue = this.getFieldValue(item, key);

        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }

        if (typeof value === 'object' && value.operator) {
          switch (value.operator) {
            case 'gt':
              return Number(itemValue) > Number(value.value);
            case 'gte':
              return Number(itemValue) >= Number(value.value);
            case 'lt':
              return Number(itemValue) < Number(value.value);
            case 'lte':
              return Number(itemValue) <= Number(value.value);
            case 'ne':
              return itemValue !== value.value;
            case 'contains':
              return String(itemValue)
                .toLowerCase()
                .includes(String(value.value).toLowerCase());
            case 'startsWith':
              return String(itemValue)
                .toLowerCase()
                .startsWith(String(value.value).toLowerCase());
            case 'endsWith':
              return String(itemValue)
                .toLowerCase()
                .endsWith(String(value.value).toLowerCase());
            default:
              return itemValue === value.value;
          }
        }

        return itemValue === value;
      });
    });
  }

  // Calculate facets for search results
  private static calculateFacets<T extends Record<string, any>>(
    items: T[],
    facetFields: string[]
  ): SearchFacet[] {
    return facetFields.map(field => {
      const valueCounts: Record<string, number> = {};

      items.forEach(item => {
        const value = this.getFieldValue(item, field);
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => {
              valueCounts[String(v)] = (valueCounts[String(v)] || 0) + 1;
            });
          } else {
            valueCounts[String(value)] = (valueCounts[String(value)] || 0) + 1;
          }
        }
      });

      const values = Object.entries(valueCounts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 values

      return {
        field,
        values,
      };
    });
  }

  // Apply sorting and pagination
  private static applySortingAndPagination<T extends Record<string, any>>(
    items: T[],
    options?: PaginationOptions
  ): T[] {
    const result = [...items];

    // Apply sorting
    if (options?.orderBy) {
      result.sort((a, b) => {
        const aValue = this.getFieldValue(a, options.orderBy!);
        const bValue = this.getFieldValue(b, options.orderBy!);
        const direction = options.orderDirection === 'desc' ? -1 : 1;

        if (aValue < bValue) return -1 * direction;
        if (aValue > bValue) return 1 * direction;
        return 0;
      });
    }

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit;

    if (limit) {
      result = result.slice(offset, offset + limit);
    } else if (offset > 0) {
      result = result.slice(offset);
    }

    return result;
  }

  // Generate search suggestions
  private static generateSuggestions<T extends Record<string, any>>(
    query: string,
    items: T[],
    fields: string[]
  ): string[] {
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    items.forEach(item => {
      fields.forEach(field => {
        const fieldValue = this.getFieldValue(item, field);
        if (fieldValue) {
          const words = fieldValue.toLowerCase().split(/\s+/);
          words.forEach(word => {
            if (word.length > 2 && word.startsWith(queryLower.split(' ')[0])) {
              suggestions.add(word);
            }
          });
        }
      });
    });

    return Array.from(suggestions).slice(0, 5); // Top 5 suggestions
  }

  // Get search history
  static getSearchHistory(): string[] {
    return StorageService.getArray<string>('search_history');
  }

  // Add to search history
  static addToSearchHistory(query: string): void {
    if (!query.trim()) return;

    const history = this.getSearchHistory();
    const updatedHistory = [query, ...history.filter(h => h !== query)].slice(
      0,
      20
    ); // Keep last 20 searches
    StorageService.setArray('search_history', updatedHistory);
  }

  // Clear search history
  static clearSearchHistory(): void {
    StorageService.setArray('search_history', []);
  }

  // Get popular search terms
  static getPopularSearchTerms(): { term: string; count: number }[] {
    const searchCounts =
      StorageService.get<Record<string, number>>('search_counts') || {};

    return Object.entries(searchCounts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Track search term usage
  static trackSearchTerm(query: string): void {
    if (!query.trim()) return;

    const searchCounts =
      StorageService.get<Record<string, number>>('search_counts') || {};
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2);

    terms.forEach(term => {
      searchCounts[term] = (searchCounts[term] || 0) + 1;
    });

    StorageService.set('search_counts', searchCounts);
  }
}
