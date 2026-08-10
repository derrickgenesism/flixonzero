import { broadcastNotification } from './actions';

export const metadata = { title: 'Broadcast Notifications — Flixon Admin' };

export default function NotificationsAdminPage() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Send Notification</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>Broadcast a message to all users or a specific audience.</p>

      <form action={broadcastNotification} style={{ maxWidth: '600px', background: 'var(--bg2)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Notification Title *</label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. New Movie Added!"
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '15px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Message Body</label>
          <textarea
            name="body"
            rows={3}
            placeholder="e.g. Check out the new action blockbuster just added to our library!"
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Link (optional)</label>
          <input
            type="text"
            name="link"
            placeholder="e.g. /movie/123 or /checkout"
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '15px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Notification Type</label>
          <select
            name="type"
            defaultValue="new_content"
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '15px' }}
          >
            <option value="new_content">🎬 New Content</option>
            <option value="subscription_expiry">⏳ Subscription Reminder</option>
            <option value="referral_earned">💰 Referral Reward</option>
            <option value="promo">🎁 Promotion</option>
            <option value="general">🔔 General Announcement</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Send To</label>
          <select
            name="audience"
            defaultValue="all"
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '15px' }}
          >
            <option value="all">All Users (Broadcast)</option>
            <option value="subscribers">Active Subscribers Only</option>
          </select>
        </div>

        <button type="submit" className="gms-btn gms-btn--primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
          Send Notification
        </button>
      </form>
    </div>
  );
}
