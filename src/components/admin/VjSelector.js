'use client';

import { useState, useEffect, useMemo } from 'react';
import { KNOWN_UGANDAN_VJS } from '@/utils/categories';

export default function VjSelector({ selectedVjs = [], onChange }) {
  const [filter, setFilter] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [dbVjs, setDbVjs] = useState([]);

  // Fetch any additional unique VJs from the database so custom ones are automatically retained
  useEffect(() => {
    let active = true;
    fetch('/api/v1/categories')
      .then(res => res.json())
      .then(json => {
        if (!active) return;
        if (json?.data && Array.isArray(json.data)) {
          const list = json.data
            .map(c => c.name)
            .filter(name => name && typeof name === 'string' && name.trim().toLowerCase().startsWith('vj '));
          setDbVjs(list);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Merge known list, DB list, and any currently selected VJs
  const allVjs = useMemo(() => {
    const map = new Map();
    const normalizeKey = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');

    // Normalize display (e.g. "vj emmy" -> "VJ Emmy", "VJ ICE P" stays "VJ ICE P")
    const addName = (name) => {
      if (!name || typeof name !== 'string') return;
      const trimmed = name.trim();
      if (!trimmed.toLowerCase().startsWith('vj ')) return;
      const key = normalizeKey(trimmed);
      if (!map.has(key)) {
        // Ensure proper casing: capitalize VJ prefix
        let formatted = trimmed;
        if (/^vj\s+/i.test(formatted)) {
          formatted = 'VJ ' + formatted.slice(3).trim();
        }
        map.set(key, formatted);
      }
    };

    KNOWN_UGANDAN_VJS.forEach(addName);
    dbVjs.forEach(addName);
    selectedVjs.forEach(addName);

    // Sort order: Top favorites first, then alphabetical
    const priority = [
      'vj junior',
      'vj emmy',
      'vj ice p',
      'vj jingo',
      'vj mark',
      'vj kamil',
      'vj jovan',
      'vj kevin',
      'vj kevo',
      'vj muba',
      'vj neil',
      'vj ulio',
      'vj ham',
      'vj mosco',
      'vj soul',
      'vj cox',
      'vj isma',
      'vj frank'
    ];

    return Array.from(map.values()).sort((a, b) => {
      const aKey = normalizeKey(a);
      const bKey = normalizeKey(b);
      const aIdx = priority.indexOf(aKey);
      const bIdx = priority.indexOf(bKey);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [dbVjs, selectedVjs]);

  // Filtered VJs
  const filteredVjs = useMemo(() => {
    if (!filter.trim()) return allVjs;
    const q = filter.trim().toLowerCase();
    return allVjs.filter(vj => vj.toLowerCase().includes(q));
  }, [allVjs, filter]);

  const isSelected = (vj) => {
    const target = vj.trim().toLowerCase();
    return selectedVjs.some(s => s && s.trim().toLowerCase() === target);
  };

  const toggleVj = (vj) => {
    const target = vj.trim().toLowerCase();
    let next;
    if (isSelected(vj)) {
      next = selectedVjs.filter(s => s && s.trim().toLowerCase() !== target);
    } else {
      next = [...selectedVjs, vj];
    }
    onChange(next);
  };

  const handleAddCustom = (e) => {
    if (e) e.preventDefault();
    let val = customInput.trim();
    if (!val) return;
    if (!val.toLowerCase().startsWith('vj ')) {
      val = `VJ ${val}`;
    }
    if (!isSelected(val)) {
      onChange([...selectedVjs, val]);
    }
    setCustomInput('');
  };

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      padding: '14px',
      marginBottom: '15px'
    }}>
      {/* Search / Filter & Add row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="🔍 Search VJ (e.g. Junior, Muba, Emmy)..."
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Add custom VJ input */}
        <div style={{ display: 'flex', gap: '6px', flex: '1 1 200px' }}>
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            placeholder="Type new VJ name..."
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="button"
            onClick={handleAddCustom}
            style={{
              padding: '8px 14px',
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            + Add VJ
          </button>
        </div>
      </div>

      {/* Selected VJs summary banner */}
      {selectedVjs.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          padding: '8px 10px',
          background: 'rgba(229, 9, 20, 0.1)',
          border: '1px solid rgba(229, 9, 20, 0.3)',
          borderRadius: '6px',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '12px', color: '#ff6b6b', fontWeight: 'bold' }}>
            Selected ({selectedVjs.length}):
          </span>
          {selectedVjs.map(vj => (
            <span
              key={vj}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'var(--acc, #e50914)',
                color: '#fff',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {vj}
              <button
                type="button"
                onClick={() => toggleVj(vj)}
                title="Remove"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '13px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Full VJ Pills Grid */}
      <div style={{
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        maxHeight: '180px',
        overflowY: 'auto',
        padding: '4px',
        border: '1px solid #222',
        borderRadius: '6px',
        background: '#0d0d0d'
      }}>
        {filteredVjs.length === 0 ? (
          <div style={{ padding: '12px', color: 'var(--text3, #888)', fontSize: '13px', width: '100%', textAlign: 'center' }}>
            No VJ matching &quot;{filter}&quot;. Press &quot;+ Add VJ&quot; above to add them!
          </div>
        ) : (
          filteredVjs.map(vj => {
            const active = isSelected(vj);
            return (
              <button
                key={vj}
                type="button"
                onClick={() => toggleVj(vj)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: active ? '1px solid var(--acc, #e50914)' : '1px solid #333',
                  background: active ? 'var(--acc, #e50914)' : '#1e1e1e',
                  color: active ? '#fff' : '#ccc',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: active ? '700' : '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {active ? '✓ ' : ''}{vj}
              </button>
            );
          })
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3, #888)' }}>
          Showing {filteredVjs.length} of {allVjs.length} available VJs (Click to select/unselect)
        </span>
      </div>
    </div>
  );
}
