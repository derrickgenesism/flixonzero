const fs = require('fs');
let code = fs.readFileSync('src/app/movie/[id]/page.js', 'utf8');

// BUG 1: initialProgress is used BEFORE it is declared (let initialProgress = 0)
// Fix: move the declaration to before the if(user) block
code = code.replace(
  "  // Auth + Access check\r\n  const { data: { user } } = await supabase.auth.getUser();",
  "  let initialProgress = 0;\r\n\r\n  // Auth + Access check\r\n  const { data: { user } } = await supabase.auth.getUser();"
);

// Remove the stale duplicate declaration that appears after
code = code.replace(
  "\r\n  let initialProgress = 0;\r\n\r\n  // Avg rating",
  "\r\n  // Avg rating"
);

// BUG 2: Related parts and moreLikeThis still use supabase queries instead of cached movies
// Fix related parts
code = code.replace(
  `  const partMatch = movie.title.match(/(.*?)(?:\\b(?:part|ep|episode|season)\\b\\s*\\d+)/i);\r\n  if (partMatch?.[1]) {\r\n    const baseTitle = partMatch[1].trim();\r\n    const { data: partsData } = await supabase.from('movies').select('*').ilike('title', \`\${baseTitle}%\`).neq('id', movie.id).order('title', { ascending: true });\r\n    if (partsData?.length > 0) relatedParts = partsData;\r\n  }`,
  `  const partMatch = movie.title.match(/(.*?)(?:\\b(?:part|ep|episode|season)\\b\\s*\\d+)/i);\r\n  if (partMatch?.[1]) {\r\n    const baseTitle = partMatch[1].trim().toLowerCase();\r\n    const allMovies = await getCachedMovies();\r\n    relatedParts = allMovies.filter(m => m.id !== movie.id && m.title.toLowerCase().startsWith(baseTitle)).sort((a, b) => a.title.localeCompare(b.title));\r\n  }`
);

// Fix moreLikeThis
code = code.replace(
  `  if (cats.length > 0) {\r\n    const { data: similar } = await supabase.from('movies').select('*').contains('categories', [cats[0]]).neq('id', movie.id).limit(12);\r\n    moreLikeThis = similar || [];\r\n  }`,
  `  if (cats.length > 0) {\r\n    const allMovies = await getCachedMovies();\r\n    moreLikeThis = allMovies.filter(m => m.id !== movie.id && Array.isArray(m.categories) && m.categories.includes(cats[0])).slice(0, 12);\r\n  }`
);

fs.writeFileSync('src/app/movie/[id]/page.js', code);
console.log('Done');
