const fs = require('fs');
let file = 'src/app/admin/(protected)/settings/page.js';
let content = fs.readFileSync(file, 'utf8');

const newSection = `        <form action={updateSettings}>
          <h3 style={{ margin: '0 0 6px', color: '#4ade80' }}>Global Free Mode</h3>
          <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'var(--text3)' }}>When enabled, ALL signed-in users can watch movies for free. Only paid users can download.</p>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="free_mode_enabled"
                defaultChecked={settings?.find(s => s.setting_key === 'free_mode_enabled')?.setting_value === 'true'}
              />
              Enable Global Free Mode
            </label>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />

          <h3 style={{ margin: '0 0 15px', color: 'var(--acc)' }}>Subscription Plans (UGX)</h3>`;

content = content.replace(`        <form action={updateSettings}>\n          <h3 style={{ margin: '0 0 15px', color: 'var(--acc)' }}>Subscription Plans (UGX)</h3>`, newSection);

fs.writeFileSync(file, content);
console.log('Admin settings updated');
