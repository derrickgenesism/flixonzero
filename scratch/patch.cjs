const fs = require('fs');
let code = fs.readFileSync('src/app/movie/[id]/page.js', 'utf8');

code = code.replace(
  "import { getActiveProfile } from '@/app/profiles/actions';",
  "import { getActiveProfile } from '@/app/profiles/actions';\nimport { getCachedMovies, getCachedMovieById, getCachedSettings } from '@/lib/cache';"
);

code = code.replace(
  "const supabase = await createClient();\n  const { data: movie } = await supabase.from('movies').select('title, description, thumbnail_url, categories, release_date, imdb_rating').eq('id', id).single();",
  "const movie = await getCachedMovieById(id);"
);

code = code.replace(
  "const supabase = await createClient();\n\n  const { data: movie, error } = await supabase.from('movies').select('*').eq('id', id).single();",
  "const movie = await getCachedMovieById(id);"
);

code = code.replace(
  /const baseTitle = partMatch\[1\]\.trim\(\);\n\s+const { data: partsData } = await supabase\.from\('movies'\)\.select\('\*'\)\.ilike\('title', `\$\{baseTitle\}%`\)\.neq\('id', movie\.id\)\.order\('title', \{ ascending: true \}\);\n\s+if \(partsData\?\.length > 0\) relatedParts = partsData;/g,
  `const baseTitle = partMatch[1].trim().toLowerCase();\n    const allMovies = await getCachedMovies();\n    relatedParts = allMovies.filter(m => m.id !== movie.id && m.title.toLowerCase().startsWith(baseTitle)).sort((a, b) => a.title.localeCompare(b.title));`
);

code = code.replace(
  /const { data: similar } = await supabase\.from\('movies'\)\.select\('\*'\)\.contains\('categories', \[cats\[0\]\]\)\.neq\('id', movie\.id\)\.limit\(12\);\n\s+moreLikeThis = similar \|\| \[\];/g,
  `const allMovies = await getCachedMovies();\n    moreLikeThis = allMovies.filter(m => m.id !== movie.id && Array.isArray(m.categories) && m.categories.includes(cats[0])).slice(0, 12);`
);

code = code.replace(
  /const { data: ppvSetting } = await supabase\.from\('admin_settings'\)\.select\('setting_value'\)\.eq\('setting_key', 'ppv_price'\)\.maybeSingle\(\);/g,
  `const settings = await getCachedSettings();\n  const ppvSetting = settings.find(s => s.setting_key === 'ppv_price');`
);

code = code.replace(
  "if (error || !movie) {",
  "if (!movie) {"
);

code = code.replace(
  "  // Extract primary video URL or detect Iframe",
  "  const supabase = await createClient();\n\n  // Extract primary video URL or detect Iframe"
);

fs.writeFileSync('src/app/movie/[id]/page.js', code);
