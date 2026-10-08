const fs = require('fs');

const files = [
  'src/app/admin/(protected)/movies/add/AddMovieClient.js',
  'src/app/admin/(protected)/movies/[id]/edit/EditMovieClient.js'
];

for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  const vjBlockSearch = `{['VJ ICE P', 'VJ Emmy', 'VJ Junior', 'VJ Jingo', 'VJ Mark'].map(vj => {`;
  
  if (content.includes(vjBlockSearch)) {
    // We want to dynamically extract existing VJs from the formData so they appear as active buttons
    const replacement = `
                {Array.from(new Set(['VJ ICE P', 'VJ Emmy', 'VJ Junior', 'VJ Jingo', 'VJ Mark', ...formData.categories.filter(c => c && c.toLowerCase().startsWith('vj '))])).map(vj => {`;
    content = content.replace(vjBlockSearch, replacement);
    
    // Now add the custom VJ input at the end of the VJ buttons block
    const vjBlockEnd = `                  );
                })}
              </div>
            </div>`;
            
    const customVjInput = `                  );
                })}
                <input
                  type="text"
                  placeholder="Type new VJ & press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val && val.toLowerCase().startsWith('vj ') && !formData.categories.includes(val)) {
                        handleManualEdit('categories', [...formData.categories, val]);
                        e.target.value = '';
                      } else if (val && !val.toLowerCase().startsWith('vj ')) {
                        alert('VJ name must start with "VJ "');
                      }
                    }
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: '20px', border: '1px solid #444', 
                    background: 'transparent', color: '#fff', fontSize: '12px', width: '200px'
                  }}
                />
              </div>
            </div>`;
            
    content = content.replace(vjBlockEnd, customVjInput);
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find VJ block in ${file}`);
  }
}
