const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./src/data/flixon_export.json', 'utf8'));

let sql = `-- SUPABASE CATEGORIES UPDATE SCRIPT\n\n`;
sql += `ALTER TABLE movies ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';\n\n`;

// To prevent making a million queries, we'll build a massive UPDATE statement using a VALUES list
let updateCases = [];
let updateIds = [];

const cleanCategory = (c) => {
    // Avoid the debug dumps, history, or watch later spam
    if (c.includes(' - History') || c.includes(' - Watch Later') || c.includes('video_tag') || c.includes('{') || c.includes('}')) {
        return null;
    }
    return c;
};

data.movies.forEach(movie => {
    let categories = [];
    if (movie.categories && Array.isArray(movie.categories)) {
        categories = movie.categories.map(cleanCategory).filter(c => c !== null);
    }
    
    // Only update if there are categories to update
    if (categories.length > 0) {
        // Escape single quotes for SQL
        const escapedCategories = categories.map(c => `"${c.replace(/'/g, "''")}"`).join(',');
        
        // Use PostgreSQL array literal format: '{"Action","Adventure"}'
        const categoryArrayStr = `'{${escapedCategories}}'`;
        
        sql += `UPDATE movies SET categories = ${categoryArrayStr} WHERE id = ${movie.id};\n`;
    }
});

fs.writeFileSync('../update_categories.sql', sql);
console.log('update_categories.sql generated successfully. Total movies updated: ' + (sql.match(/UPDATE movies/g) || []).length);
