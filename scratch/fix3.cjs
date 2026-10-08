const fs = require('fs');
let code = fs.readFileSync('src/app/admin/(protected)/page.js', 'utf8');

// FIX 1: premiumCount is never computed - add it after freeCount destructure
code = code.replace(
  "  // -- 2. AGGREGATE LOGIC --------------------------------------------------\r\n  \r\n  // Users & Signups",
  "  // -- 2. AGGREGATE LOGIC --------------------------------------------------\r\n\r\n  const premiumCount = (librarySize || 0) - (freeCount || 0);\r\n\r\n  // Users & Signups"
);

// FIX 2: UUID resolution - cap uniqueUuids to only the TOP 10 users we actually DISPLAY
// (not all UUIDs in uuidSet which could be hundreds)
// The top users are already sliced to 10. We only need emails for topUsersRaw + last50Txs user_ids.
// Change the uuidSet building: only add from topUsersRaw (already sliced to 10) + last50Txs
code = code.replace(
  `  // Fetch emails only for the unique UUIDs we actually need to display
  const uuidMap = {};
  const uniqueUuids = Array.from(uuidSet);`,
  `  // Fetch emails only for the unique UUIDs we actually need to display
  // Only resolve emails for the top 10 users + last 50 transaction user IDs (not all from history)
  const displayUuids = new Set();
  topUsersRaw.forEach(u => displayUuids.add(u.id));
  last50Txs?.forEach(tx => { if (tx.user_id) displayUuids.add(tx.user_id); });
  const uuidMap = {};
  const uniqueUuids = Array.from(displayUuids);`
);

fs.writeFileSync('src/app/admin/(protected)/page.js', code);
console.log('Done');
