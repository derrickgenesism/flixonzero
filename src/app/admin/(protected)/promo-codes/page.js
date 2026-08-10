import { createClient } from '@/utils/supabase/server';
import { createPromoCode, deletePromoCode } from './actions';
import Link from 'next/link';

export const metadata = { title: 'Promo & Gift Codes — Flixon Admin' };

export default async function PromoCodesPage() {
  const supabase = await createClient();

  const { data: promoCodes } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Promo & Gift Codes</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>Create discount codes for promotions and gift cards for specific access periods.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        {/* Create Promo Code */}
        <div style={{ background: 'var(--bg2)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--acc)' }}>Create Promo Code</h2>
          <form action={createPromoCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input type="hidden" name="kind" value="promo" />
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Code (leave blank to auto-generate)</label>
              <input type="text" name="code" placeholder="e.g. SAVE50" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', textTransform: 'uppercase' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Discount Type</label>
              <select name="discount_type" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (UGX)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Discount Value</label>
              <input type="number" name="discount_value" required placeholder="e.g. 20 for 20% or 5000 for 5,000 UGX" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Max Uses (blank = unlimited)</label>
              <input type="number" name="max_uses" placeholder="e.g. 100" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Expires At (optional)</label>
              <input type="date" name="expires_at" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }} />
            </div>
            <button type="submit" className="gms-btn gms-btn--primary" style={{ width: '100%' }}>Create Promo Code</button>
          </form>
        </div>

        {/* Create Gift Card */}
        <div style={{ background: 'var(--bg2)', padding: '28px', borderRadius: '16px', border: '1px solid rgba(74,222,128,0.2)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#4ade80' }}>Create Gift Card</h2>
          <form action={createPromoCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input type="hidden" name="kind" value="gift" />
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Code (blank = auto-generate)</label>
              <input type="text" name="code" placeholder="e.g. GIFT2026" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', textTransform: 'uppercase' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Days of Access</label>
              <input type="number" name="days" required placeholder="e.g. 30 (one month)" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>How many gift cards to generate</label>
              <input type="number" name="quantity" defaultValue="1" min="1" max="100" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Expires At (optional)</label>
              <input type="date" name="expires_at" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }} />
            </div>
            <button type="submit" className="gms-btn gms-btn--primary" style={{ width: '100%', background: '#16a34a' }}>Generate Gift Card(s)</button>
          </form>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div style={{ background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: '600' }}>Code</th>
              <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: '600' }}>Discount</th>
              <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: '600' }}>Uses</th>
              <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: '600' }}>Expires</th>
              <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '14px 20px', color: 'var(--text2)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes?.length > 0 ? promoCodes.map(code => (
              <tr key={code.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 20px', color: '#fff', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '1px' }}>{code.code}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text2)' }}>{code.discount_type}</td>
                <td style={{ padding: '14px 20px', color: '#fff' }}>
                  {code.discount_type === 'percentage' ? `${code.discount_value}%` : `${Number(code.discount_value).toLocaleString()} UGX`}
                </td>
                <td style={{ padding: '14px 20px', color: 'var(--text2)' }}>{code.use_count} / {code.max_uses || '∞'}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text3)', fontSize: '13px' }}>{code.expires_at ? new Date(code.expires_at).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                    background: code.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(229,9,20,0.1)',
                    color: code.is_active ? '#4ade80' : '#ff6b6b'
                  }}>
                    {code.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <form action={deletePromoCode} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={code.id} />
                    <button type="submit" style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Deactivate</button>
                  </form>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text3)' }}>No promo codes yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
