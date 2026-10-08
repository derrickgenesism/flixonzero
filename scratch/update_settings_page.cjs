const fs = require('fs');
let file = 'src/app/admin/(protected)/settings/page.js';
let content = fs.readFileSync(file, 'utf8');

const injection = `
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
`;

content = content.replace(
  `<h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>Multiple Profiles</h3>`,
  injection + `\n        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>Multiple Profiles</h3>`
);

fs.writeFileSync(file, content);
console.log('Added Google Auth toggle to settings page');
