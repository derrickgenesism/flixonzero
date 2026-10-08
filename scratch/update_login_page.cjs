const fs = require('fs');
let file = 'src/app/login/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import LoginForm from './LoginForm';", "import LoginForm from './LoginForm';\nimport { getCachedSettings } from '@/lib/cache';");

content = content.replace(
  "const refCode = params?.ref || '';",
  "const refCode = params?.ref || '';\n  const settings = await getCachedSettings();\n  const googleAuthEnabled = settings?.find(s => s.setting_key === 'google_auth_enabled')?.setting_value === 'true';"
);

content = content.replace(
  "<LoginForm refCode={refCode} />",
  "<LoginForm refCode={refCode} googleAuthEnabled={googleAuthEnabled} />"
);

fs.writeFileSync(file, content);
console.log('Passed googleAuthEnabled to LoginForm');
