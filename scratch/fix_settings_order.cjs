const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const accessLogic = `  const globalFreeMode = settings.find(s => s.setting_key === 'free_mode_enabled')?.setting_value === 'true';`;
const settingsLogic = `  // PPV price from settings
  const settings = await getCachedSettings();`;

if (content.indexOf(accessLogic) < content.indexOf(settingsLogic)) {
  // We need to move `const settings = await getCachedSettings();` above access logic
  // Let's just fetch it again or move it.
  // Actually, I can just do `const settings = await getCachedSettings();` right before globalFreeMode, and remove the other one.
  const replacement = `  const settings = await getCachedSettings();
  const globalFreeMode = settings.find(s => s.setting_key === 'free_mode_enabled')?.setting_value === 'true';`;
  
  content = content.replace(accessLogic, replacement);
  
  // Now remove the other one to prevent "Identifier 'settings' has already been declared"
  content = content.replace(`  const settings = await getCachedSettings();\n  const ppvSetting = settings.find(s => s.setting_key === 'ppv_price');`, `  const ppvSetting = settings.find(s => s.setting_key === 'ppv_price');`);
  
  fs.writeFileSync(file, content);
  console.log('Fixed settings ReferenceError!');
} else {
  console.log('Already in correct order or not found');
}
