const fs = require('fs');
let file = 'src/app/search/page.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fill, minmax\(130px, 1fr\)\)', gap: '12px' \}\}>[\s\S]*?<\/div>\s*<\/section>/;

const replacement = `<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {VJS.map(vj => (
                  <Link key={vj} href={\`/category/\` + encodeURIComponent(vj)} style={{ padding: '8px 16px', background: 'var(--bg2)', borderRadius: '20px', color: '#fff', fontSize: '13px', fontWeight: '600', border: '1px solid var(--border)', transition: 'var(--tr)', textDecoration: 'none' }} className="hover-lift">
                    {vj}
                  </Link>
                ))}
              </div>
            </section>`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Successfully updated VJs section layout to match Genres');
} else {
  console.log('Could not find VJs section regex');
}
