const fs = require('fs');

const filesToUpdate = [
  'src/app/admin/(protected)/movies/add/AddMovieClient.js',
  'src/app/admin/(protected)/movies/[id]/edit/EditMovieClient.js'
];

for (let file of filesToUpdate) {
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
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px', marginTop: '10px' }}>Special Tags</label>
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
                        if (isFree) {
                          cats = cats.filter(c => c !== 'Free to Watch');
                        } else {
                          cats.push('Free to Watch');
                        }
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
            </div>`;
            
  content = content.replace(vjBlockEnd, newBlock);
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
