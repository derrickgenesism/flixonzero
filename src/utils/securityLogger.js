import { createAdminClient } from '@/utils/supabase/admin';

/**
 * Logs a security event to the database.
 * @param {string} eventType - e.g., 'WEBHOOK_TAMPERING', 'UNAUTHORIZED_ACCESS', 'PAYMENT_MISMATCH'
 * @param {string} severity - 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
 * @param {string} description - Human readable explanation
 * @param {Object} metadata - JSON payload for debugging (IP, headers, etc)
 */
export async function logSecurityEvent(eventType, severity, description, metadata = {}) {
  try {
    const supabase = createAdminClient();
    
    // Fire and forget - we don't want security logging to crash the main request if it fails
    // or if the table hasn't been created yet.
    supabase.from('security_logs').insert({
      event_type: eventType,
      severity: severity,
      description: description,
      metadata: metadata
    }).then(({ error }) => {
      if (error) console.error('[SecurityLogger] Failed to log:', error.message);
    });
    
    // Also log to console for Vercel/server logs
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      console.warn(`[SECURITY ALERT] ${severity}: ${eventType} - ${description}`);
    }
  } catch (err) {
    console.error('[SecurityLogger] Critical failure:', err);
  }
}
