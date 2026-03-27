/**
 * Safely parse a JSON string.
 * Returns the parsed object if successful, or the original string if it's not valid JSON.
 */
export function safeJsonParse<T = any>(value: any): T {
  if (typeof value !== 'string') {
    return value;
  }
  
  try {
    return JSON.parse(value);
  } catch (e) {
    return value as unknown as T;
  }
}
