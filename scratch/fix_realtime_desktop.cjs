const fs = require('fs');
let file = 'src/components/NavbarClient.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const channel = supabase\n        .channel('desktop_support_unread_badge')",
  "const channelName = `desktop_support_unread_badge_${thread.id}_${Math.random()}`;\n        const channel = supabase\n        .channel(channelName)"
);

fs.writeFileSync(file, content);
console.log('Fixed Desktop Realtime subscription bug');
