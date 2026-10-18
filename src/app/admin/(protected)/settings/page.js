const { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');
import { createClient } from '@/utils/supabase/server'
import { saveSettings } from './actions'

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const { createAdminClient } = require('@/utils/supabase/admin');
  const supabase = createAdminClient()
  const { data: settings } = await _injectedAdminClient().from('admin_settings').select('*')

  const tmdbKey = settings?.find(s => s.setting_key === 'tmdb_api_key')?.setting_value || ''
  const flwPublic = settings?.find(s => s.setting_key === 'flutterwave_public_key')?.setting_value || ''
  const flwSecret = settings?.find(s => s.setting_key === 'flutterwave_secret_key')?.setting_value || ''

  const platformName = settings?.find(s => s.setting_key === 'platform_name')?.setting_value || 'FlixOn'
  const platformCurrency = settings?.find(s => s.setting_key === 'platform_currency')?.setting_value || 'UGX'
  const manualPaymentEnabled = settings?.find(s => s.setting_key === 'manual_payment_enabled')?.setting_value !== 'false'
  const manualPaymentTitle = settings?.find(s => s.setting_key === 'manual_payment_title')?.setting_value || 'Direct Mobile Money / Bank Transfer'
  const manualPaymentNumbers = settings?.find(s => s.setting_key === 'manual_payment_numbers')?.setting_value || 'MTN Mobile Money: 0770000000 (Account Name)\nAirtel Money: 0750000000 (Account Name)'
  const manualPaymentInstructions = settings?.find(s => s.setting_key === 'manual_payment_instructions')?.setting_value || '1. Send the exact plan amount to one of our official numbers above.\n2. Enter the phone number or sender name you paid from below.\n3. Click "I Have Sent Money". Our team will verify and activate your subscription in 5-15 minutes!'

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>System Settings</h1>
      
      <form action={saveSettings} style={{ background: 'var(--bg2)', padding: '30px', borderRadius: '10px', maxWidth: '600px' }}>
        
        {/* White-Label Branding */}
        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>🏷️ Platform Branding & Currency</h3>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '15px' }}>
          Personalize the platform name and billing currency for your brand.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Platform / Brand Name</label>
            <input 
              type="text" 
              name="platform_name" 
              defaultValue={platformName}
              placeholder="e.g. MyStream"
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Platform Currency</label>
            <input 
              type="text" 
              name="platform_currency" 
              defaultValue={platformCurrency}
              placeholder="e.g. UGX, USD, KES, NGN, EUR"
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '25px 0' }} />

        {/* Manual Payment System */}
        <h3 style={{ margin: '0 0 6px', color: '#38bdf8' }}>📱 Manual Payments (No API Required)</h3>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '15px' }}>
          Allow users to pay directly by sending money to your phone numbers (MTN, Airtel, M-Pesa, Bank, Crypto, etc.). Users submit the number they paid with, and you approve it with 1-click in the Transactions tab.
        </p>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#38bdf8', fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              name="manual_payment_enabled" 
              defaultChecked={manualPaymentEnabled}
              style={{ transform: 'scale(1.2)' }}
            />
            Enable Manual / Direct Payment Mode
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Payment Method Title</label>
          <input 
            type="text" 
            name="manual_payment_title" 
            defaultValue={manualPaymentTitle}
            placeholder="e.g. Direct Mobile Money / Bank Transfer"
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
            Payment Receiving Numbers & Accounts (Shown to User)
          </label>
          <textarea 
            name="manual_payment_numbers" 
            defaultValue={manualPaymentNumbers}
            rows={4}
            placeholder={"MTN Mobile Money: 077XXXXXXX (Your Name)\nAirtel Money: 075XXXXXXX (Your Name)"}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
            Instructions for Customer (Step-by-step)
          </label>
          <textarea 
            name="manual_payment_instructions" 
            defaultValue={manualPaymentInstructions}
            rows={4}
            placeholder="Step 1: Send money to one of our numbers. Step 2: Enter your phone number below and click submit."
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', fontSize: '13px', resize: 'vertical' }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '25px 0' }} />

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

        <h3 style={{ margin: '0 0 15px', color: 'var(--acc)' }}>Mobile App Settings</h3>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>App Download URL</label>
          <input 
            type="text" 
            name="app_download_url" 
            defaultValue={settings?.find(s => s.setting_key === 'app_download_url')?.setting_value || ''}
            placeholder="e.g. https://your-domain.com/app.apk"
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

        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>Limited-Time Offer Countdown</h3>
        <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'var(--text3)' }}>Shows a countdown banner above the subscription plans, a small timer on movies people watch for free, and in the &quot;Subscribe to download&quot; prompt. Each visitor gets their own timer that restarts when it hits zero.</p>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="offer_enabled"
              defaultChecked={settings?.find(s => s.setting_key === 'offer_enabled')?.setting_value !== 'false'}
            />
            Show offer countdown
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Countdown length (minutes)</label>
            <input
              type="number"
              min="1"
              max="1440"
              name="offer_duration_minutes"
              defaultValue={settings?.find(s => s.setting_key === 'offer_duration_minutes')?.setting_value || '60'}
              placeholder="60"
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Discount shown (% OFF)</label>
            <input
              type="number"
              min="0"
              max="99"
              name="offer_discount_percent"
              defaultValue={settings?.find(s => s.setting_key === 'offer_discount_percent')?.setting_value || '50'}
              placeholder="50"
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>
        </div>
        <p style={{ margin: '-10px 0 25px', fontSize: '12px', color: 'var(--text3)' }}>Set the discount to 0 to hide the percentage and just show &quot;Special Price&quot;. Changes show on checkout immediately and on movie pages within an hour.</p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>Promo & Gift Codes</h3>
        <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'var(--text3)' }}>Enable or disable the &quot;Have a promo code?&quot; input during checkout.</p>
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

        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>TV Series System</h3>
        <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'var(--text3)' }}>Enable or disable the Series feature across the platform (Navbar, Homepage, Browsing).</p>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="series_enabled"
              defaultChecked={settings?.find(s => s.setting_key === 'series_enabled')?.setting_value === 'true'}
            />
            Enable TV Series System
          </label>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        
        <h3 style={{ margin: '0 0 6px', color: '#4ade80' }}>Global Free Mode</h3>
        <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'var(--text3)' }}>When enabled, ALL movies become free to watch for any signed-in user (downloads remain restricted to Premium users).</p>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#4ade80', fontWeight: 'bold' }}>
            <input
              type="checkbox"
              name="free_mode_enabled"
              defaultChecked={settings?.find(s => s.setting_key === 'free_mode_enabled')?.setting_value === 'true'}
              style={{ transform: 'scale(1.2)' }}
            />
            Turn ON Global Free Mode
          </label>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        
        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>Authentication</h3>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="google_auth_enabled"
              defaultChecked={settings?.find(s => s.setting_key === 'google_auth_enabled')?.setting_value === 'true'}
            />
            Enable Google Sign-In
          </label>
          <p style={{ margin: '5px 0 0 24px', fontSize: '12px', color: 'var(--text3)' }}>Only enable this if you have configured your Google OAuth credentials in the Supabase Dashboard.</p>
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
            Enable Multiple Profiles (Who&apos;s watching?)
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

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>🛡️ Security & VPN Shield</h3>
        <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'var(--text3)' }}>
          Protect FlixOn against automated bots, VPNs, hosting proxies, and payment abusers.
        </p>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="vpn_blocking_enabled"
              defaultChecked={settings?.find(s => s.setting_key === 'vpn_blocking_enabled')?.setting_value === 'true'}
            />
            <strong>Block VPN & Proxy Connections</strong>
          </label>
          <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: 'var(--text3)' }}>
            Detects datacenter hosting IPs, VPN tunnels, and anonymous proxies with fail-open safety for Ugandan mobile networks (MTN & Airtel).
          </p>
        </div>

        <div style={{ marginBottom: '25px', marginLeft: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text2)' }}>
            VPN Blocking Scope
          </label>
          <select
            name="vpn_blocking_mode"
            defaultValue={settings?.find(s => s.setting_key === 'vpn_blocking_mode')?.setting_value || 'all'}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: '4px'
            }}
          >
            <option value="all" style={{ background: '#18181b', color: '#fff' }}>
              Whole Platform (Block VPN everywhere across FlixOn)
            </option>
            <option value="checkout" style={{ background: '#18181b', color: '#fff' }}>
              Checkout & Payments Only (Block VPN only when paying)
            </option>
          </select>
        </div>

        <div style={{ marginBottom: '25px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Live Threat Defense & IP Blocklist</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Manage banned IPs, blocked devices, and security logs in real-time.</div>
            </div>
            <a
              href="/admin/security-logs"
              style={{
                background: 'var(--acc)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                textDecoration: 'none'
              }}
            >
              Open Security Center →
            </a>
          </div>
        </div>

        <button type="submit" className="gms-btn gms-btn--primary">
          Save Settings
        </button>
      </form>
    </div>
  )
}
