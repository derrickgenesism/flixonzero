const fs = require('fs');
let file = 'src/app/admin/(protected)/movies/[id]/edit/EditMovieClient.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /<Field label="VJ \(Translator\)">[\s\S]*?<\/Field>/;

const newBlock = `<Field label="VJ (Translator) & Special Tags">
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    {(() => {
                      const catsArray = typeof form.categories === 'string' ? form.categories.split(',').map(s => s.trim()).filter(Boolean) : [];
                      const allVjs = Array.from(new Set(['VJ ICE P', 'VJ Emmy', 'VJ Junior', 'VJ Jingo', 'VJ Mark', ...catsArray.filter(c => c && c.toLowerCase().startsWith('vj '))]));
                      
                      return allVjs.map(vj => {
                        const isSelected = catsArray.includes(vj);
                        return (
                          <button
                            key={vj}
                            type="button"
                            onClick={() => {
                              let cats = [...catsArray];
                              if (isSelected) {
                                cats = cats.filter(c => c !== vj);
                              } else {
                                cats.push(vj);
                              }
                              set('categories', cats.join(', '));
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
                      });
                    })()}
                    
                    {(() => {
                      const catsArray = typeof form.categories === 'string' ? form.categories.split(',').map(s => s.trim()).filter(Boolean) : [];
                      return (
                        <input
                          type="text"
                          placeholder="Type new VJ & press Enter..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.target.value.trim();
                              if (val && val.toLowerCase().startsWith('vj ') && !catsArray.includes(val)) {
                                set('categories', [...catsArray, val].join(', '));
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
                      );
                    })()}
                  </div>

                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Special Tags</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {(() => {
                      const catsArray = typeof form.categories === 'string' ? form.categories.split(',').map(s => s.trim()).filter(Boolean) : [];
                      const newArrivalTag = catsArray.find(c => c.startsWith('NewArrival:'));
                      const isNewArrival = !!newArrivalTag || catsArray.includes('New Arrival');
                      
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            let cats = catsArray.filter(c => !c.startsWith('NewArrival:') && c !== 'New Arrival');
                            if (!isNewArrival) {
                              const expDate = Date.now() + (14 * 24 * 60 * 60 * 1000);
                              cats.push(\`NewArrival:\${expDate}\`);
                            }
                            set('categories', cats.join(', '));
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
                      const catsArray = typeof form.categories === 'string' ? form.categories.split(',').map(s => s.trim()).filter(Boolean) : [];
                      const isFree = catsArray.includes('Free to Watch');
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            let cats = [...catsArray];
                            if (isFree) cats = cats.filter(c => c !== 'Free to Watch');
                            else cats.push('Free to Watch');
                            set('categories', cats.join(', '));
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
                </Field>`;

content = content.replace(regex, newBlock);
fs.writeFileSync(file, content);
console.log('EditMovieClient.js fixed');
