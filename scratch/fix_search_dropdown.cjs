const fs = require('fs');
let file = 'src/app/globals.css';
let content = fs.readFileSync(file, 'utf8');

const oldDropdown = `.flx-search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 420px;
  max-width: calc(100vw - 32px);
  background: rgba(15,15,15,0.97);`;

const newDropdown = `.flx-search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  width: 100%;
  background: rgba(15,15,15,0.97);`;

content = content.replace(oldDropdown, newDropdown);
fs.writeFileSync(file, content);
console.log('Fixed search dropdown width and positioning');
