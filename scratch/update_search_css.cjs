const fs = require('fs');
let file = 'src/app/globals.css';
let content = fs.readFileSync(file, 'utf8');

// Fix dropdown positioning and size
content = content.replace(
  `.flx-search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0; right: 0;`,
  `.flx-search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 420px;
  max-width: calc(100vw - 32px);`
);

// Enhance the "See All Results" footer
content = content.replace(
  `.flx-search-footer {
  padding: 10px 14px;
  text-align: center;
  background: rgba(255,255,255,0.02);
  color: var(--acc2);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--tr);
}
.flx-search-footer:hover { background: rgba(229,9,20,0.08); }`,
  `.flx-search-footer {
  padding: 16px;
  text-align: center;
  background: var(--acc);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity var(--tr);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.flx-search-footer:hover { opacity: 0.9; }`
);

// Make the result font a bit larger
content = content.replace(
  `.flx-search-result-title {
  color: #fff;
  font-size: 13px;`,
  `.flx-search-result-title {
  color: #fff;
  font-size: 15px;`
);

// Result img slightly bigger
content = content.replace(
  `.flx-search-result img {
  width: 36px;
  height: 54px;`,
  `.flx-search-result img {
  width: 44px;
  height: 66px;`
);

fs.writeFileSync(file, content);
console.log('Updated globals.css for search dropdown');
