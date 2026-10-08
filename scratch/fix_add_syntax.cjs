const fs = require('fs');
let file = 'src/app/admin/(protected)/movies/add/AddMovieClient.js';
let content = fs.readFileSync(file, 'utf8');

const targetStart = '<div>\n            <label style={{ display: \'block\', fontSize: \'12px\', color: \'var(--text2)\', marginBottom: \'5px\' }}>VJ (Translator)</label>';

const regex = /<div>\s*<label[^>]*>VJ \(Translator\)<\/label>[\s\S]*?}\)/;

const newBlock = `<div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>VJ (Translator) & Special Tags</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
              {Array.from(new Set(['VJ ICE P', 'VJ Emmy', 'VJ Junior', 'VJ Jingo', 'VJ Mark', ...formData.categories.filter(c => c && c.toLowerCase().startsWith('vj '))])).map(vj => {
                const isSelected = formData.categories.includes(vj);
                return (
                  <button
                    key={vj}
                    type="button"
                    onClick={() => {
                      let cats = [...formData.categories];
                      if (isSelected) cats = cats.filter(c => c !== vj);
                      else cats.push(vj);
                      handleManualEdit('categories', cats);
                    }}
                    style={{
                      padding: '6px 12px', borderRadius: '20px', border: '1px solid #444', 
                      background: isSelected ? 'var(--acc)' : '#222',
                      color: '#fff', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {vj}
                  </button>
                );
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
            
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Special Tags</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {(() => {
                const newArrivalTag = formData.categories.find(c => c.startsWith('NewArrival:'));
                const isNewArrival = !!newArrivalTag || formData.categories.includes('New Arrival');
                
                return (
                  <button
                    type="button"
                    onClick={() => {
                      let cats = formData.categories.filter(c => !c.startsWith('NewArrival:') && c !== 'New Arrival');
                      if (!isNewArrival) {
                        const expDate = Date.now() + (14 * 24 * 60 * 60 * 1000);
                        cats.push(\`NewArrival:\${expDate}\`);
                      }
                      handleManualEdit('categories', cats);
                    }}
                    style={{
                      padding: '6px 12px', borderRadius: '20px', border: '1px solid #444', 
                      background: isNewArrival ? 'var(--acc)' : '#222',
                      color: '#fff', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    New Arrival (14 Days)
                  </button>
                );
              })()}

              {(() => {
                const isFree = formData.categories.includes('Free to Watch');
                return (
                  <button
                    type="button"
                    onClick={() => {
                      let cats = [...formData.categories];
                      if (isFree) cats = cats.filter(c => c !== 'Free to Watch');
                      else cats.push('Free to Watch');
                      handleManualEdit('categories', cats);
                    }}
                    style={{
                      padding: '6px 12px', borderRadius: '20px', border: '1px solid #444', 
                      background: isFree ? '#4ade80' : '#222',
                      color: isFree ? '#000' : '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: isFree ? 'bold' : 'normal'
                    }}
                  >
                    Free to Watch
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})`;

content = content.replace(regex, newBlock);
fs.writeFileSync(file, content);
console.log('Fixed syntax error in AddMovieClient.js');
