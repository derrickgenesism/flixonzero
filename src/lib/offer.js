/**
 * Helpers for the "limited-time offer" countdown shown on checkout, movie pages
 * and the download prompt. Settings live in the existing `admin_settings` table:
 *
 *   offer_enabled           'true' | 'false'   (default: on)
 *   offer_duration_minutes  number             (default: 60)
 *   offer_discount_percent  number             (default: 50, 0 hides the % figure)
 */

export const OFFER_SETTING_KEYS = ['offer_enabled', 'offer_duration_minutes', 'offer_discount_percent'];

export function parseOfferSettings(rows) {
  const get = (key) => rows?.find((r) => r.setting_key === key)?.setting_value;

  const enabledRaw = get('offer_enabled');
  const durationRaw = parseInt(get('offer_duration_minutes'), 10);
  const percentRaw = parseInt(get('offer_discount_percent'), 10);

  return {
    enabled: enabledRaw !== 'false',
    durationMinutes: Number.isFinite(durationRaw) && durationRaw > 0 ? Math.min(durationRaw, 1440) : 60,
    discountPercent: Number.isFinite(percentRaw) && percentRaw >= 0 ? Math.min(percentRaw, 99) : 50,
  };
}
