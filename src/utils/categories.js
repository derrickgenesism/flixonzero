/**
 * Categories that should never be displayed — these are WordPress taxonomy
 * labels that got imported as category values from the old WP export.
 */
export const BAD_CATEGORIES = new Set([
  'category', 'post_tag', 'uncategorized', 'Uncategorized',
  'post_format', 'nav_menu', 'link_category',
]);

/**
 * Returns a filtered, clean list of categories from a movie object.
 * @param {string[]|null} categories
 * @returns {string[]}
 */
export function cleanCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.filter(c => c && !BAD_CATEGORIES.has(c.trim().toLowerCase()) && c.trim() !== '');
}

/**
 * Returns the first clean category or null.
 * @param {string[]|null} categories
 * @returns {string|null}
 */
export function firstCleanCategory(categories) {
  const clean = cleanCategories(categories);
  return clean.length > 0 ? clean[0] : null;
}
