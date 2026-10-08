const fs = require('fs');

let file = 'src/components/DownloadButton.js';
let content = fs.readFileSync(file, 'utf8');

const oldLogic = `  const handleDownload = async () => {
    if (requiresSubscription) {
      router.push('/checkout');
      return;
    }`;

const newLogic = `  const handleDownload = async () => {
    if (requiresSubscription) {
      alert("Please subscribe to unlock downloads.");
      router.push('/checkout');
      return;
    }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(file, content);
console.log('DownloadButton updated');
