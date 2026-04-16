/**
 * Formats API error messages into a human-readable string.
 * Handles FastAPI/Pydantic validation errors (422) which return an array of objects.
 */
export const formatError = (error) => {
  if (!error) return 'An unknown error occurred';

  // Handle axios error response
  if (error.response?.data) {
    const data = error.response.data;
    
    // Check for FastAPI 'detail' field
    const detail = data.detail || data.message || data.error;
    
    if (detail) {
      if (Array.isArray(detail)) {
        // FastAPI validation errors
        return detail
          .map((err) => {
            const loc = err.loc ? err.loc.join('.') : 'error';
            return `${loc}: ${err.msg}`;
          })
          .join(', ');
      }
      if (typeof detail === 'object') {
        return JSON.stringify(detail);
      }
      return detail;
    }
  }

  // Handle standard Error object
  return error.message || 'An unexpected error occurred';
};
