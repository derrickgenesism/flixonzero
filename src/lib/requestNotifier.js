import { createAdminClient } from '@/utils/supabase/admin';
import { sendAdminEmail } from '@/lib/email';

const ADMIN_EMAIL = 'mutyabaderrick77@gmail.com';

/**
 * Dispatches both Telegram and Email alerts when a movie/series is requested by a user,
 * and saves a persistent thread in support_threads & support_messages.
 */
export async function sendMovieRequestAlerts({
  title,
  year,
  posterUrl,
  vj,
  notes,
  mediaType = 'movie',
  userEmail,
  username,
  userId = null
}) {
  const admin = createAdminClient();

  // 1. Record in support_threads & support_messages for persistent admin tracking
  try {
    let resolvedUserId = userId;
    if (!resolvedUserId && userEmail) {
      const { data: p } = await admin
        .from('user_profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      resolvedUserId = p?.id || null;
    }

    // Create a support thread for this request
    const { data: thread } = await admin
      .from('support_threads')
      .insert({
        user_id: resolvedUserId,
        subject: `🎬 Request: ${title} (${vj})`,
        status: 'open',
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (thread?.id) {
      const content = 
        `**NEW CONTENT REQUEST**\n\n` +
        `• **Title:** ${title} ${year ? `(${year})` : ''}\n` +
        `• **Type:** ${mediaType === 'series' ? 'TV Series' : 'Movie'}\n` +
        `• **Requested VJ:** ${vj}\n` +
        `• **Requester:** ${username || 'User'} (${userEmail || 'Guest'})\n` +
        (notes ? `• **Notes:** ${notes}\n` : '') +
        (posterUrl ? `• **Poster:** ${posterUrl}\n` : '');

      await admin.from('support_messages').insert({
        thread_id: thread.id,
        sender_id: resolvedUserId,
        sender_role: 'user',
        content,
        is_read: false
      });
    }
  } catch (dbErr) {
    console.warn('[sendMovieRequestAlerts] DB save notice:', dbErr);
  }

  // 2. Telegram Alert to WORK DESK
  try {
    const { data: settings } = await admin
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

    const botToken = settings?.find(s => s.setting_key === 'telegram_bot_token')?.setting_value?.trim();
    const chatId = settings?.find(s => s.setting_key === 'telegram_chat_id')?.setting_value?.trim();

    if (botToken && chatId) {
      const now = new Date();
      const eatDate = now.toLocaleDateString('en-UG', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Africa/Kampala'
      });
      const eatTime = now.toLocaleTimeString('en-UG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Kampala'
      });

      const safeTitle = (title || 'Unknown').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeYear = year ? `(${year})` : '';
      const safeVj = (vj || 'Original').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeUser = (username || 'User').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeEmail = (userEmail || 'Guest').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeNotes = notes ? notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '<i>None</i>';
      const typeLabel = mediaType === 'series' ? '📺 TV SERIES' : '🎬 MOVIE';

      const caption =
        `📥 <b>NEW USER REQUEST: ${typeLabel}</b> 📥\n\n` +
        `• <b>Title:</b> <b>${safeTitle}</b> ${safeYear}\n` +
        `• <b>Requested VJ:</b> <b>${safeVj}</b>\n` +
        `• <b>Requester:</b> ${safeUser} (<code>${safeEmail}</code>)\n` +
        `• <b>Notes:</b> ${safeNotes}\n` +
        `• <b>Date:</b> ${eatDate} at ${eatTime} EAT\n\n` +
        `⚡ <b>Status:</b> 🟡 <i>Pending Upload / Review</i>\n` +
        `👉 Check Admin Support to respond or review.`;

      // If poster exists, sendPhoto with caption
      if (posterUrl && posterUrl.startsWith('http')) {
        try {
          const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              photo: posterUrl,
              caption,
              parse_mode: 'HTML'
            })
          });
          const photoData = await photoRes.json();
          if (photoData.ok) {
            console.log('[sendMovieRequestAlerts] Telegram photo sent successfully');
            // Photo sent, return early
          } else {
            console.warn('[sendMovieRequestAlerts] Telegram sendPhoto fallback:', photoData.description);
            // Fallback to text
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text: caption, parse_mode: 'HTML' })
            });
          }
        } catch {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: caption, parse_mode: 'HTML' })
          });
        }
      } else {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: caption, parse_mode: 'HTML' })
        });
      }
    }
  } catch (tgErr) {
    console.warn('[sendMovieRequestAlerts] Telegram dispatch warning:', tgErr);
  }

  // 3. Email Dispatch to mutyabaderrick77@gmail.com
  try {
    const typeLabel = mediaType === 'series' ? 'TV Series' : 'Movie';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f0f; color: #fff; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden;">
          <div style="background: #e50914; padding: 20px 24px; text-align: center;">
            <h1 style="margin: 0; color: #fff; font-size: 20px; font-weight: 800; letter-spacing: 1px;">FLIXON CONTENT REQUEST</h1>
          </div>
          <div style="padding: 24px;">
            <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
              ${posterUrl ? `<img src="${posterUrl}" alt="${title}" style="width: 120px; height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);" />` : ''}
              <div style="flex: 1; min-width: 200px;">
                <h2 style="margin: 0 0 8px; font-size: 22px; color: #fff;">${title} ${year ? `<span style="color: #888; font-size: 16px;">(${year})</span>` : ''}</h2>
                <div style="display: inline-block; background: rgba(229,9,20,0.15); color: #e50914; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px;">
                  ${typeLabel.toUpperCase()}
                </div>
                <p style="margin: 6px 0; color: #ccc; font-size: 14px;"><strong>Requested VJ:</strong> <span style="color: #4ade80; font-weight: bold;">${vj}</span></p>
                <p style="margin: 6px 0; color: #ccc; font-size: 14px;"><strong>Requester:</strong> ${username || 'User'} (${userEmail || 'Guest'})</p>
              </div>
            </div>
            ${notes ? `
              <div style="background: rgba(255,255,255,0.04); border-left: 3px solid #e50914; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #888; font-weight: 600; text-transform: uppercase;">User Notes</p>
                <p style="margin: 0; font-size: 14px; color: #fff; line-height: 1.5;">${notes}</p>
              </div>
            ` : ''}
            <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08);">
              <p style="margin: 0; font-size: 12px; color: #888;">FlixOn Automated Content Request Engine</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const text = `FlixOn Content Request: "${title}" (${year || ''}) - VJ: ${vj} - Requester: ${username || 'User'} (${userEmail}) - Notes: ${notes || 'None'}`;

    await sendAdminEmail({
      subject: `🎬 Movie Request: "${title}" (${vj})`,
      html,
      text
    });
  } catch (emailErr) {
    console.warn('[sendMovieRequestAlerts] Email alert error:', emailErr);
  }
}
