const fs = require('fs');

const file = 'src/app/admin/(protected)/movies/[id]/edit/EditMovieClient.js';
let content = fs.readFileSync(file, 'utf8');

const vjBlockEnd = `                  );
                })}
              </div>
            </div>`;
          
const newBlock = `                  );
                })}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Special Tags</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['New Arrival', 'Free to Watch'].map(tag => {
                  const isSelected = formData.categories.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        let cats = [...formData.categories];
                        if (isSelected) {
                          cats = cats.filter(c => c !== tag);
                        } else {
                          cats.push(tag);
                        }
                        handleManualEdit('categories', cats);
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: '20px', border: '1px solid #444', 
                        background: isSelected ? 'var(--acc)' : '#222',
                        color: '#fff', cursor: 'pointer', fontSize: '12px'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>`;
          
content = content.replace(vjBlockEnd, newBlock);
fs.writeFileSync(file, content);
console.log(`Updated ${file}`);
