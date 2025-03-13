/**
 * Format a duration in milliseconds to a human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string (e.g., "2h 30m 15s")
 */
export const formatDuration = (ms) => {
    if (!ms || isNaN(ms)) return '0s';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    const parts = [];
    
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    
    return parts.join(' ');
  };
  
  /**
   * Format a duration in seconds to a human-readable string
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration string
   */
  export const formatDurationFromSeconds = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0s';
    return formatDuration(seconds * 1000);
  };
  
  /**
   * Get a relative time string (e.g., "2 hours ago")
   * @param {string|Date} date - Date to compare
   * @returns {string} Relative time string
   */
  export const getRelativeTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    
    // If less than a minute, show "just now"
    if (diffMs < 60000) {
      return 'just now';
    }
    
    return formatDuration(diffMs) + ' ago';
  }; 