/**
 * Platform White-Label & Site Configuration
 * 
 * Anyone purchasing or deploying this platform can customize their brand
 * name, currency, taglines, and contact details either right here or
 * via their environment variables / Admin Settings.
 */

export const siteConfig = {
  // Brand Identity
  name: process.env.NEXT_PUBLIC_APP_NAME || 'FlixOn',
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || 'FlixOn',
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "World's #1 Video & Movie Streaming Platform",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Stream and download unlimited HD movies, series, and exclusive releases on your phone, tablet, or TV.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://flixon.net',

  // Currency & Financials
  currency: process.env.NEXT_PUBLIC_CURRENCY || 'UGX',
  currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'UGX',
  locale: process.env.NEXT_PUBLIC_LOCALE || 'en-UG',

  // Support & Social Links
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@flixon.net',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP || '+256700000000',
  telegramHandle: process.env.NEXT_PUBLIC_TELEGRAM || '@flixon_support',

  // Visuals & Branding
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  primaryColor: '#e50914',
  accentColor: '#ff2d2d',

  // SEO & Social Sharing
  twitterHandle: '@FlixOnUganda',
  ogImage: '/logo.png',
};

/**
 * Format amounts nicely with currency symbol and thousands separator
 * Example: formatCurrency(10000, 'UGX') -> "10,000 UGX"
 * Example: formatCurrency(9.99, 'USD') -> "$9.99"
 */
export function formatCurrency(amount, customCurrency = null) {
  const curr = customCurrency || siteConfig.currency;
  const num = Number(amount || 0);

  if (curr.toUpperCase() === 'USD') {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: num % 1 === 0 ? 0 : 2 })}`;
  }
  if (curr.toUpperCase() === 'EUR') {
    return `€${num.toLocaleString('en-US', { minimumFractionDigits: num % 1 === 0 ? 0 : 2 })}`;
  }
  if (curr.toUpperCase() === 'GBP') {
    return `£${num.toLocaleString('en-US', { minimumFractionDigits: num % 1 === 0 ? 0 : 2 })}`;
  }
  if (curr.toUpperCase() === 'KES') {
    return `KSh ${num.toLocaleString('en-US')}`;
  }
  if (curr.toUpperCase() === 'NGN') {
    return `₦${num.toLocaleString('en-US')}`;
  }
  if (curr.toUpperCase() === 'TZS') {
    return `TZS ${num.toLocaleString('en-US')}`;
  }
  if (curr.toUpperCase() === 'GHS') {
    return `GH₵ ${num.toLocaleString('en-US')}`;
  }

  // Default (e.g. UGX or other)
  return `${num.toLocaleString('en-US')} ${curr}`;
}
