const fs = require('fs');
const glob = require('glob'); // Make sure glob is installed, or we can just recursively read files

const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/app/admin/(protected)', function(filePath) {
  if (filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Auto-fix table wrappers
    if (content.includes("<table")) {
      // Find where overflow: 'hidden' is used right before <table
      if (content.includes("overflow: 'hidden'")) {
         content = content.replace(/overflow:\s*'hidden'/g, "overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch'");
         changed = true;
      }
      if (content.includes("overflowX: 'auto' }")) {
         content = content.replace(/overflowX:\s*'auto'\s*}/g, "overflowX: 'auto', WebkitOverflowScrolling: 'touch' }");
         changed = true;
      }
    }
    
    // Fix any mobile input stretching
    if (content.includes("<input") || content.includes("<select")) {
        content = content.replace(/width:\s*'300px'/g, "width: '100%', maxWidth: '300px'");
        content = content.replace(/width:\s*'400px'/g, "width: '100%', maxWidth: '400px'");
        content = content.replace(/width:\s*'500px'/g, "width: '100%', maxWidth: '500px'");
        changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
    }
  }
});
console.log('Automated responsive fixes applied to admin pages');
