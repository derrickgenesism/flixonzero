import { createClient } from '@/utils/supabase/server'
import { saveSettings } from './actions'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('admin_settings').select('*')

  const tmdbKey = settings?.find(s => s.setting_key === 'tmdb_api_key')?.setting_value || ''
  const flwPublic = settings?.find(s => s.setting_key === 'flutterwave_public_key')?.setting_value || ''
  const flwSecret = settings?.find(s => s.setting_key === 'flutterwave_secret_key')?.setting_value || ''

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>System Settings</h1>
      
      <form action={saveSettings} style={{ background: 'var(--bg2)', padding: '30px', borderRadius: '10px', maxWidth: '600px' }}>
        
        <h3 style={{ margin: '0 0 15px', color: 'var(--acc)' }}>TMDB Integration</h3>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>TMDB API Key</label>
          <input 
            type="text" 
            name="tmdb_api_key" 
            defaultValue={tmdbKey}
            placeholder="Enter TMDB v3 API Key"
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        </div>

        <h3 style={{ margin: '0 0 15px', color: 'var(--acc)' }}>Flutterwave Payments</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Public Key</label>
          <input 
            type="text" 
            name="flutterwave_public_key" 
            defaultValue={flwPublic}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Secret Key</label>
          <input 
            id="flutterwave_secret_key" 
            name="flutterwave_secret_key" 
            defaultValue={flwSecret} 
            className="gms-input" 
            placeholder="FLWSECK_TEST-..."
            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="flutterwave_webhook_secret" style={{ display: 'block', marginBottom: '8px', color: 'var(--text2)' }}>Flutterwave Webhook Secret</label>
          <input 
            type="text" 
            id="flutterwave_webhook_secret" 
            name="flutterwave_webhook_secret" 
            defaultValue={settings?.find(s => s.setting_key === 'flutterwave_webhook_secret')?.setting_value || ''} 
            className="gms-input" 
            placeholder="Your custom random string for verifying webhooks"
            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} 
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        <h3 style={{ margin: '0 0 15px', color: 'var(--acc)' }}>Cloudflare R2 Integration</h3>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '15px' }}>Used for scanning and importing videos directly from your R2 storage bucket.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Cloudflare Account ID</label>
            <input 
              type="text" 
              name="r2_account_id" 
              defaultValue={settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value || ''}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>R2 Bucket Name</label>
            <input 
              type="text" 
              name="r2_bucket_name" 
              defaultValue={settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value || ''}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>R2 Access Key ID</label>
            <input 
              type="text" 
              name="r2_access_key" 
              defaultValue={settings?.find(s => s.setting_key === 'r2_access_key')?.setting_value || ''}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>R2 Secret Access Key</label>
            <input 
              type="password" 
              name="r2_secret_key" 
              defaultValue={settings?.find(s => s.setting_key === 'r2_secret_key')?.setting_value || ''}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>CDN Domain</label>
          <input 
            type="text" 
            name="cdn_domain" 
            placeholder="e.g. cdn.flixon.net"
            defaultValue={settings?.find(s => s.setting_key === 'cdn_domain')?.setting_value || ''}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        <h3 style={{ margin: '0 0 15px', color: 'var(--acc)' }}>Homepage Layout</h3>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '15px' }}>Toggle which sections appear on the homepage.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px' }}>
          {['Continue Watching', 'My List', 'Trending', 'New Arrivals', 'Latest 2026', 'Free', 'Top Rated', 'Premium Exclusives', 'Popular Series', 'Coming Soon'].map((section, idx) => {
            const rawSections = settings?.find(s => s.setting_key === 'homepage_sections')?.setting_value;
            let sectionEnabled = true; // default true
            if (rawSections) {
              try {
                const parsed = JSON.parse(rawSections);
                if (parsed[section] !== undefined) sectionEnabled = parsed[section];
              } catch(e) {}
            }
            return (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '4px' }}>
                <input 
                  type="checkbox" 
                  name={`hp_section_${section}`}
                  defaultChecked={sectionEnabled}
                />
                {section}
              </label>
            );
          })}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        <h3 style={{ margin: '0 0 15px', color: 'var(--acc)' }}>Referral & Affiliate System</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              name="referrals_enabled" 
              defaultChecked={settings?.find(s => s.setting_key === 'referrals_enabled')?.setting_value === 'true'}
            />
            Enable Referral System
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Reward Type</label>
          <select 
            name="referral_reward_type" 
            defaultValue={settings?.find(s => s.setting_key === 'referral_reward_type')?.setting_value || 'flat'}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          >
            <option value="flat" style={{ color: '#000' }}>Flat Amount (e.g. 5000 UGX)</option>
            <option value="percentage" style={{ color: '#000' }}>Percentage (e.g. 10%)</option>
          </select>
        </div>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Reward Amount</label>
          <input
            type="number"
            name="referral_reward_amount"
            defaultValue={settings?.find(s => s.setting_key === 'referral_reward_amount')?.setting_value || '0'}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>UGX per Watch Day (conversion rate)</label>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text3)' }}>How much of their referral balance equals 1 day of streaming access.</p>
          <input
            type="number"
            name="referral_ugx_per_day"
            defaultValue={settings?.find(s => s.setting_key === 'referral_ugx_per_day')?.setting_value || '500'}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        <h3 style={{ margin: '0 0 15px', color: 'var(--acc)' }}>Google Authentication</h3>
        <div style={{ marginBottom: '25px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text2)' }}>
            Google Login must be configured in your Supabase Dashboard.
          </p>
          <ol style={{ margin: '0 0 0 20px', fontSize: '13px', color: 'var(--text2)', padding: 0 }}>
            <li style={{ marginBottom: '6px' }}>Go to Supabase Dashboard &gt; Authentication &gt; Providers.</li>
            <li style={{ marginBottom: '6px' }}>Enable Google.</li>
            <li style={{ marginBottom: '6px' }}>Enter your Client ID and Client Secret from Google Cloud Console.</li>
            <li style={{ marginBottom: '0' }}>Save the changes in Supabase. Flixon will automatically show the Google Login button when this is done.</li>
          </ol>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>Pay-Per-View (Movie Rental)</h3>
        <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'var(--text3)' }}>Allow users to rent a single movie for 48 hours at a set price, without needing a full subscription.</p>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="ppv_enabled"
              defaultChecked={settings?.find(s => s.setting_key === 'ppv_enabled')?.setting_value === 'true'}
            />
            Enable Pay-Per-View (Rental) System
          </label>
        </div>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Rental Price (UGX — for 48-hour access)</label>
          <input
            type="number"
            name="ppv_price"
            defaultValue={settings?.find(s => s.setting_key === 'ppv_price')?.setting_value || '0'}
            placeholder="e.g. 3000"
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>Promo & Gift Codes</h3>
        <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'var(--text3)' }}>Enable or disable the "Have a promo code?" input during checkout.</p>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="promo_enabled"
              defaultChecked={settings?.find(s => s.setting_key === 'promo_enabled')?.setting_value === 'true'}
            />
            Show Promo Code input on Checkout
          </label>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>Multiple Profiles</h3>
        <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'var(--text3)' }}>Allow users to create multiple sub-profiles and charge for extra slots.</p>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="profiles_enabled"
              defaultChecked={settings?.find(s => s.setting_key === 'profiles_enabled')?.setting_value === 'true'}
            />
            Enable Multiple Profiles (Who's watching?)
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Included Free Profiles</label>
          <input
            type="number"
            name="free_profiles_limit"
            defaultValue={settings?.find(s => s.setting_key === 'free_profiles_limit')?.setting_value || '2'}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Price for Extra Profile Slot (UGX)</label>
          <input
            type="number"
            name="extra_profile_price"
            defaultValue={settings?.find(s => s.setting_key === 'extra_profile_price')?.setting_value || '5000'}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        </div>

        <button type="submit" className="gms-btn gms-btn--primary">
          Save Settings
        </button>
      </form>
    </div>
  )
}
