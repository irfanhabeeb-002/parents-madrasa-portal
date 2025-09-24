/**
 * Text utility functions for content manipulation
 */

/**
 * Truncates text to a specified length while preserving word boundaries
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the truncated text
 * @param suffix - Suffix to append when text is truncated (default: '...')
 * @returns Truncated text with suffix if needed
 */
export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Find the last space within the maxLength to avoid cutting words
  const truncateIndex = text.lastIndexOf(' ', maxLength - suffix.length);

  // If no space found within range, just cut at maxLength
  const cutIndex =
    truncateIndex > 0 ? truncateIndex : maxLength - suffix.length;

  return text.substring(0, cutIndex).trim() + suffix;
};

/**
 * Truncates announcement content based on display context
 * @param message - The announcement message
 * @param context - Display context ('mobile' | 'desktop')
 * @returns Truncated message appropriate for the context
 */
export const truncateAnnouncement = (
  message: string,
  context: 'mobile' | 'desktop' = 'desktop'
): string => {
  if (!message) {
    return message;
  }

  // Different truncation lengths for different contexts
  const maxLengths = {
    mobile: 120, // Shorter for mobile banner
    desktop: 200, // Longer for desktop cards
  };

  return truncateText(message, maxLengths[context]);
};

/**
 * Checks if text needs truncation
 * @param text - The text to check
 * @param maxLength - Maximum allowed length
 * @returns True if text exceeds maxLength
 */
export const needsTruncation = (text: string, maxLength: number): boolean => {
  return text && text.length > maxLength;
};
