/**
 * Categories that should never be displayed — these are WordPress taxonomy
 * labels that got imported as category values from the old WP export.
 */
export const BAD_CATEGORIES = new Set([
  'category', 'post_tag', 'uncategorized', 'Uncategorized',
  'post_format', 'nav_menu', 'link_category',
]);

/**
 * Master list of all prominent Ugandan VJs (Video Jockeys)
 */
export const KNOWN_UGANDAN_VJS = [
  'VJ Junior',
  'VJ Emmy',
  'VJ ICE P',
  'VJ Jingo',
  'VJ Mark',
  'VJ Kamil',
  'VJ Jovan',
  'VJ Kevin',
  'VJ Kevo',
  'VJ MUBA',
  'VJ Neil',
  'VJ Ulio',
  'VJ Ham',
  'VJ Mosco',
  'VJ Soul',
  'VJ Cox',
  'VJ Isma',
  'VJ Frank',
  'VJ Martin',
  'VJ Shafi',
  'VJ Omuwansi',
  'VJ Henrry',
  'VJ Dan',
  'VJ Bryan',
  'VJ Sammy',
  'VJ Nasser',
  'VJ Ronnie',
  'VJ Young',
  'VJ Steve',
  'VJ Kasule',
  'VJ Bob',
  'VJ Smart',
  'VJ Ricky',
  'VJ Ben',
  'VJ Mosh',
  'VJ Jose',
  'VJ Kim',
  'VJ Tony',
  'VJ Simple',
  'VJ Prince',
  'VJ Chris',
  'VJ Arthur',
  'VJ Abbas',
  'VJ Ray',
  'VJ Jackson',
  'VJ Jerry',
  'VJ Moses',
  'VJ Tonny',
  'VJ Alex',
  'VJ Paul',
  'VJ David',
  'VJ Brian',
  'VJ Emma',
  'VJ Rogers',
  'VJ Denis',
  'VJ Ivan',
  'VJ Eddy',
  'VJ Allan',
  'VJ Hassan',
  'VJ Meddy',
  'VJ Jimmy',
  'VJ Baker',
  'VJ Reagan'
];

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
