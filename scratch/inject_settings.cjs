const fs = require('fs');
let file = 'src/app/admin/(protected)/settings/actions.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('logSecurityEvent')) {
  content = content.replace(
    "import { revalidatePath } from 'next/cache'",
    "import { revalidatePath } from 'next/cache'\nimport { logSecurityEvent } from '@/utils/securityLogger';"
  );
  content = content.replace(
    "if (!user) throw new Error(\"Unauthorized\");",
    "if (!user) {\n    await logSecurityEvent('UNAUTHORIZED_ACCESS', 'HIGH', 'Attempt to access saveSettings action without authentication', {});\n    throw new Error(\"Unauthorized\");\n  }"
  );
  content = content.replace(
    "if (adminCheck?.role !== 'administrator') throw new Error(\"Forbidden\");",
    "if (adminCheck?.role !== 'administrator') {\n    await logSecurityEvent('ROLE_ESCALATION_ATTEMPT', 'CRITICAL', `User ${user.email} attempted to save admin settings but is not an administrator`, { email: user.email, actualRole: adminCheck?.role });\n    throw new Error(\"Forbidden\");\n  }"
  );
  // Log successful changes
  content = content.replace(
    "revalidatePath('/admin/settings')",
    "await logSecurityEvent('SETTINGS_CHANGED', 'LOW', `Admin ${user.email} updated platform settings`, { email: user.email });\n  revalidatePath('/admin/settings')"
  );
  fs.writeFileSync(file, content);
}
console.log('Settings patched');
