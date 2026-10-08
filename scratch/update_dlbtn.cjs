const fs = require('fs');

let file = 'src/components/DownloadButton.js';
let content = fs.readFileSync(file, 'utf8');

// Add router to DownloadButton
if (!content.includes('useRouter')) {
  content = content.replace(`import { useState, useEffect, useRef } from 'react';`, `import { useState, useEffect, useRef } from 'react';\nimport { useRouter } from 'next/navigation';`);
}

// Add requiresSubscription prop
content = content.replace(`export default function DownloadButton({ movieId, title }) {`, `export default function DownloadButton({ movieId, title, requiresSubscription }) {\n  const router = useRouter();`);

// Update handleDownload
const handleDL = `  const handleDownload = async () => {
    if (requiresSubscription) {
      router.push('/checkout');
      return;
    }
    setLoading(true);`;
    
content = content.replace(`  const handleDownload = async () => {\n    setLoading(true);`, handleDL);

fs.writeFileSync(file, content);
console.log('DownloadButton updated');
