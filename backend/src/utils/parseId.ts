/**
 * Parses a route parameter into a positive integer id.
 *
 * Express 5 types `req.params` values as `string | string[]` because wildcard
 * params resolve to arrays. None of this API's routes use wildcards, so the
 * value is always a string at runtime, but the non-string case is rejected
 * explicitly rather than coerced.
 */
export function parseId(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const id = parseInt(value, 10);
  return isNaN(id) ? null : id;
}
