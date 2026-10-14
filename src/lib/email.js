import nodemailer from 'nodemailer';
import { createAdminClient } from '@/utils/supabase/admin';

const ADMIN_DEFAULT_EMAIL = 'mutyabaderrick77@gmail.com';

/**
 * Sends an email notification to the administrator (mutyabaderrick77@gmail.com).
 * Uses SMTP settings from admin_settings or environment variables.
 */
export async function sendAdminEmail({ subject, html, text }) {
  try {
    const admin = createAdminClient();
    const { data: settings } = await admin
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'admin_notification_email',
        'smtp_host',
        'smtp_port',
        'smtp_user',
        'smtp_pass',
        'smtp_secure',
        'resend_api_key'
      ]);

    const toEmail = settings?.find(s => s.setting_key === 'admin_notification_email')?.setting_value?.trim() || ADMIN_DEFAULT_EMAIL;
    const resendKey = settings?.find(s => s.setting_key === 'resend_api_key')?.setting_value?.trim() || process.env.RESEND_API_KEY;

    // 1. Try Resend if configured
    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`
          },
          body: JSON.stringify({
            from: 'FlixOn System <notifications@flixon.net>',
            to: [toEmail],
            subject: subject,
            html: html,
            text: text
          })
        });
        const data = await res.json();
        if (res.ok) {
          console.log('[sendAdminEmail] Sent successfully via Resend to', toEmail);
          return { success: true, provider: 'resend', id: data.id };
        }
        console.warn('[sendAdminEmail] Resend API error:', data);
      } catch (err) {
        console.warn('[sendAdminEmail] Resend error:', err);
      }
    }

    // 2. Try Nodemailer SMTP
    const host = settings?.find(s => s.setting_key === 'smtp_host')?.setting_value?.trim() || process.env.SMTP_HOST;
    const port = Number(settings?.find(s => s.setting_key === 'smtp_port')?.setting_value?.trim() || process.env.SMTP_PORT || 587);
    const user = settings?.find(s => s.setting_key === 'smtp_user')?.setting_value?.trim() || process.env.SMTP_USER;
    const pass = settings?.find(s => s.setting_key === 'smtp_pass')?.setting_value?.trim() || process.env.SMTP_PASS;
    const secure = settings?.find(s => s.setting_key === 'smtp_secure')?.setting_value === 'true' || port === 465;

    if (host && user && pass) {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });

      const info = await transporter.sendMail({
        from: `"FlixOn Notifications" <${user}>`,
        to: toEmail,
        subject,
        text,
        html
      });

      console.log('[sendAdminEmail] Sent successfully via SMTP to', toEmail, info.messageId);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    }

    console.info(`[sendAdminEmail] SMTP credentials not set in admin_settings. Email content prepared for ${toEmail}: ${subject}`);
    return { success: false, reason: 'smtp_not_configured', target: toEmail };
  } catch (err) {
    console.error('[sendAdminEmail] Unexpected error:', err);
    return { success: false, error: err.message };
  }
}
