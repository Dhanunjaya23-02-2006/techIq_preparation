const BASE_API_URL = import.meta.env.VITE_API_URL || '';

export const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  // Extract base URL from API URL (remove /api/v1 if present)
  const baseUrl = BASE_API_URL.replace(/\/api\/v1\/?$/, '');
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
};
