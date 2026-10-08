const fs = require('fs');
let file = 'src/app/admin/(protected)/movies/[id]/edit/actions.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /const \{ error \} = await supabase\.from\('movies'\)\.update\(\{([\s\S]*?)\}\)\.eq\('id', id\);/;

const newBlock = `const { error } = await supabase.from('movies').update({
    title: movieData.title,
    description: movieData.description,
    type: movieData.type,
    thumbnail_url: movieData.thumbnail_url,
    video_url: movieData.video_url,
    categories: movieData.categories,
    release_year: movieData.release_year ? Number(movieData.release_year) : null,
    actors: movieData.actors
  }).eq('id', id);`;

content = content.replace(regex, newBlock);
fs.writeFileSync(file, content);
console.log('Fixed Edit actions.js schema error');
