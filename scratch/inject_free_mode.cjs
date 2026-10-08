const fs = require('fs');
let file = 'src/app/admin/(protected)/settings/page.js';
let content = fs.readFileSync(file, 'utf8');

const injection = `
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
`;

content = content.replace(
  `<h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>Multiple Profiles</h3>`,
  injection + `\n        <h3 style={{ margin: '0 0 6px', color: 'var(--acc)' }}>Multiple Profiles</h3>`
);

fs.writeFileSync(file, content);
console.log('Injected Global Free Mode checkbox');
