const fs = require('fs');
let code = fs.readFileSync('src/app/admin/(protected)/page.js', 'utf8');

// Check if premiumCount is already there
if (code.includes('const premiumCount')) {
  console.log('premiumCount already defined - OK');
} else {
  console.log('premiumCount MISSING - needs fix');
  // Insert after AGGREGATE LOGIC section header, before Users & Signups
  const marker = '// Users & Signups\n  const conversionRate';
  const replacement = 'const premiumCount = (librarySize || 0) - (freeCount || 0);\n\n  // Users & Signups\n  const conversionRate';
  if (code.includes(marker)) {
    code = code.replace(marker, replacement);
    fs.writeFileSync('src/app/admin/(protected)/page.js', code);
    console.log('Fixed!');
  } else {
    console.log('Marker not found, trying alternate...');
    const marker2 = '// Users & Signups\r\n  const conversionRate';
    if (code.includes(marker2)) {
      code = code.replace(marker2, 'const premiumCount = (librarySize || 0) - (freeCount || 0);\r\n\r\n  // Users & Signups\r\n  const conversionRate');
      fs.writeFileSync('src/app/admin/(protected)/page.js', code);
      console.log('Fixed with CRLF!');
    } else {
      console.log('Could not find marker');
    }
  }
}
