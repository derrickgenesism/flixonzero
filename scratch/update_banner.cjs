const fs = require('fs');

let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const oldBanner = `<div style={{ maxWidth: '1100px', margin: '20px auto 0', padding: '12px 20px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '8px', textAlign: 'center', color: '#4ade80', fontSize: '14px' }}>
            <strong style={{ fontWeight: '800', marginRight: '6px' }}>?? Free Mode Active:</strong>
            You can watch for free! <Link href="/checkout" style={{ color: '#fff', textDecoration: 'underline', marginLeft: '4px' }}>Subscribe to unlock downloads.</Link>
          </div>`;

const newBanner = `<div style={{ maxWidth: '1100px', margin: '20px auto 0', padding: '12px 20px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '8px', textAlign: 'center', color: '#4ade80', fontSize: '15px' }}>
            <strong style={{ fontWeight: '800' }}>?? Watch for free right now!</strong>
          </div>`;

content = content.replace(oldBanner, newBanner);
fs.writeFileSync(file, content);
console.log('movie page banner updated');
