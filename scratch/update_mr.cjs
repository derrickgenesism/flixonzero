const fs = require('fs');

let mrCode = fs.readFileSync('src/components/MovieRow.js', 'utf8');

mrCode = mrCode.replace(
  `export default function MovieRow({ title, movies, href }) {`,
  `export default function MovieRow({ title, movies, href, accentColor }) {`
);

mrCode = mrCode.replace(
  `<h2 className="gms-section-title">{title}</h2>`,
  `<h2 className="gms-section-title" style={accentColor ? { color: accentColor, textShadow: \`0 0 10px \${accentColor}40\` } : {}}>{title}</h2>`
);

mrCode = mrCode.replace(
  `<Link href={href} style={{ color: 'var(--acc)', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>`,
  `<Link href={href} style={{ color: accentColor || 'var(--acc)', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>`
);

fs.writeFileSync('src/components/MovieRow.js', mrCode);
console.log('MovieRow.js updated');
