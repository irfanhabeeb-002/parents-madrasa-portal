import type { Timestamp } from '../types/common';

/**
 * Converts a Date or Timestamp to a Date object
 */
export const toDate = (dateOrTimestamp: Date | Timestamp): Date => {
  if (dateOrTimestamp instanceof Date) {
    return dateOrTimestamp;
  }

  // Handle Firestore Timestamp
  if (typeof dateOrTimestamp === 'object' && 'seconds' in dateOrTimestamp) {
    return new Date(dateOrTimestamp.seconds * 1000);
  }

  // Fallback - try to parse as date
  return new Date(dateOrTimestamp as any);
};

/**
 * Formats a Date or Timestamp as a locale date string
 */
export const formatDate = (
  dateOrTimestamp: Date | Timestamp,
  locale?: string
): string => {
  const date = toDate(dateOrTimestamp);
  return date.toLocaleDateString(locale);
};

/**
 * Formats a Date or Timestamp as a locale date and time string
 */
export const formatDateTime = (
  dateOrTimestamp: Date | Timestamp,
  locale?: string
): string => {
  const date = toDate(dateOrTimestamp);
  return date.toLocaleString(locale);
};

/**
 * Gets the time difference in milliseconds between two dates
 */
export const getTimeDifference = (
  date1: Date | Timestamp,
  date2: Date | Timestamp
): number => {
  return toDate(date1).getTime() - toDate(date2).getTime();
};

/**
 * Checks if a date is today
 */
export const isToday = (dateOrTimestamp: Date | Timestamp): boolean => {
  const date = toDate(dateOrTimestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Formats duration in seconds to human readable format
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};
