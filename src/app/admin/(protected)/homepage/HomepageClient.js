'use client';

import { useState } from 'react';
import { saveHomepageSettings } from './actions';

const ALL_CATEGORIES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 
  'Romance', 'Sci-Fi', 'TV Movie', 'Thriller', 'War', 'Western',
  'VJ ICE P', 'VJ Emmy', 'VJ Junior', 'VJ Jingo', 'VJ Mark'
];

const STATIC_SECTIONS = [
  'Continue Watching', 'My List', 'Trending', 'New Arrivals', 'Latest 2026',
  'Free', 'Top Rated', 'Premium Exclusives', 'Popular Series', 'Coming Soon'
];

export default function HomepageClient({ initialActiveCategories, initialSections }) {
  const [activeCategories, setActiveCategories] = useState(
    initialActiveCategories?.length > 0 ? initialActiveCategories : ['Action', 'Adventure', 'Comedy']
  );
  const [sections, setSections] = useState(initialSections || {});
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const toggleCategory = (cat) => {
    if (activeCategories.includes(cat)) {
      setActiveCategories(activeCategories.filter(c => c !== cat));
    } else {
      setActiveCategories([...activeCategories, cat]);
    }
  };

  const toggleSection = (sec) => {
    setSections(prev => ({ ...prev, [sec]: prev[sec] === false ? true : false }));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newArr = [...activeCategories];
    const temp = newArr[index - 1];
    newArr[index - 1] = newArr[index];
    newArr[index] = temp;
    setActiveCategories(newArr);
  };

  const moveDown = (index) => {
    if (index === activeCategories.length - 1) return;
    const newArr = [...activeCategories];
    const temp = newArr[index + 1];
    newArr[index + 1] = newArr[index];
    newArr[index] = temp;
    setActiveCategories(newArr);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    const res = await saveHomepageSettings(activeCategories, sections);
    setIsSaving(false);
    
    if (res?.error) {
      setStatus({ type: 'error', message: res.error });
    } else {
      setStatus({ type: 'success', message: 'Homepage layout saved successfully!' });
    }
  };

  // Find categories not currently active
  const inactiveCategories = ALL_CATEGORIES.filter(c => !activeCategories.includes(c));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Top row: Dynamic categories layout */}
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* LEFT: Active Categories (Draggable/Sortable) */}
        <div style={{ flex: '1 1 400px', background: 'var(--bg2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Active Genre Categories</h2>
          
          {activeCategories.length === 0 && (
            <p style={{ color: 'var(--text2)', fontStyle: 'italic' }}>No categories selected.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeCategories.map((cat, idx) => (
              <div key={cat} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.05)',
                padding: '12px 15px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="checkbox" 
                    checked={true}
                    onChange={() => toggleCategory(cat)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold' }}>{cat}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: idx === 0 ? 'rgba(255,255,255,0.2)' : 'var(--text)', 
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      padding: '5px'
                    }}
                  >
                    ▲
                  </button>
                  <button 
                    onClick={() => moveDown(idx)}
                    disabled={idx === activeCategories.length - 1}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: idx === activeCategories.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--text)', 
                      cursor: idx === activeCategories.length - 1 ? 'not-allowed' : 'pointer',
                      padding: '5px'
                    }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '30px' }}>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="gms-btn gms-btn--primary" 
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              {isSaving ? 'Saving...' : 'Save Layout'}
            </button>
            
            {status && (
              <div style={{ 
                marginTop: '15px', 
                padding: '12px', 
                borderRadius: '6px', 
                background: status.type === 'success' ? 'rgba(70, 180, 80, 0.1)' : 'rgba(229, 9, 20, 0.1)',
                color: status.type === 'success' ? '#46b450' : '#e50914',
                textAlign: 'center'
              }}>
                {status.message}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Inactive Categories */}
        <div style={{ flex: '1 1 300px', background: 'var(--bg2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Available Genres</h2>
          
          {inactiveCategories.length === 0 && (
            <p style={{ color: 'var(--text2)', fontStyle: 'italic' }}>All categories are active.</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {inactiveCategories.map(cat => (
              <label key={cat} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}>
                <input 
                  type="checkbox" 
                  checked={false}
                  onChange={() => toggleCategory(cat)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text2)' }}>{cat}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Static UI Sections */}
      <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Standard Page Sections</h2>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>
          Toggle the visibility of standard UI sections like "Trending", "New Arrivals", etc. <br/>
          (If they are enabled but empty, they will be hidden automatically by the system.)
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {STATIC_SECTIONS.map(sec => {
            const isEnabled = sections[sec] !== false; // Default is true
            return (
              <label key={sec} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '16px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                cursor: 'pointer',
                border: isEnabled ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.05)'
              }}>
                <input 
                  type="checkbox" 
                  checked={isEnabled}
                  onChange={() => toggleSection(sec)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#4ade80' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: isEnabled ? '#fff' : 'var(--text3)' }}>{sec}</span>
                  <span style={{ fontSize: '12px', color: isEnabled ? '#4ade80' : 'var(--text3)' }}>{isEnabled ? 'Visible' : 'Hidden'}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
