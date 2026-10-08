const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = walk('./src/components').concat(walk('./src/app'));

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, i) => {
    if (line.includes('Date.now()')) {
      if (!content.includes('useEffect') && !content.includes('suppressHydrationWarning') && !content.includes('useState')) {
        console.log('[Hydration] ' + file + ':' + (i+1) + ' uses Date.now() potentially in render.');
      }
    }
    
    if (line.match(/<Link\s+[^>]*href=["'](?:#|)["']/)) {
      console.log('[Broken Link] ' + file + ':' + (i+1) + ' has an empty or hash href.');
    }

    const compMatches = line.match(/<([A-Z][A-Za-z0-9]+)/g);
    if (compMatches) {
      compMatches.forEach(match => {
        const comp = match.slice(1);
        const isImported = new RegExp('import\\\\s+[^;]*\\\\b' + comp + '\\\\b').test(content) || new RegExp('require\\\\([^)]*\\\\)\\\\.' + comp).test(content);
        const isDefined = new RegExp('(?:function|class|const|let|var)\\\\s+' + comp + '\\\\b').test(content);
        if (!isImported && !isDefined && comp !== 'Fragment') {
          console.log('[Missing Import] ' + file + ':' + (i+1) + ' uses <' + comp + '> but it doesn\\'t seem to be imported or defined.');
        }
      });
    }
  });
}
console.log('Check complete.');
