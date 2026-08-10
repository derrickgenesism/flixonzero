'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateMovie, deleteMovie } from './actions';

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', borderRadius: '8px', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: '600',
  color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: '7px',
};

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function EditMovieClient({ movie }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: movie.title || '',
    description: movie.description || '',
    type: movie.type || 'video',
    thumbnail_url: movie.thumbnail_url || '',
    backdrop_url: movie.backdrop_url || '',
    video_url: movie.video_url || '',
    categories: (movie.categories || []).join(', '),
    release_year: movie.release_year || '',
    actors: movie.actors || '',
    director: movie.director || '',
    runtime: movie.runtime || '',
    imdb_rating: movie.imdb_rating || '',
    trailer_url: movie.trailer_url || '',
    is_coming_soon: movie.is_coming_soon || false,
  });

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = {
      ...form,
      categories: form.categories.split(',').map(s => s.trim()).filter(Boolean),
    };

    const res = await updateMovie(movie.id, payload);
    setSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const res = await deleteMovie(movie.id);
    if (res.error) {
      setError(res.error);
      setDeleting(false);
    } else {
      router.push('/admin/movies');
    }
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <Link href="/admin/movies" style={{ color: 'var(--text2)', fontSize: '22px', textDecoration: 'none', flexShrink: 0 }}>←</Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: 0 }}>Edit Movie</h1>
          <p style={{ color: 'var(--text3)', margin: '4px 0 0', fontSize: '13px' }}>ID: {movie.id}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {confirmDelete ? (
            <>
              <span style={{ color: '#e50914', fontSize: '13px', alignSelf: 'center' }}>Are you sure?</span>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '9px 16px', background: '#e50914', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                {deleting ? 'Deleting...' : '🗑️ Confirm Delete'}
              </button>
            </>
          ) : (
            <button onClick={handleDelete} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid rgba(229,9,20,0.4)', color: '#e50914', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              🗑️ Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '9px 22px', background: saved ? '#46b450' : 'var(--acc)',
              border: 'none', color: '#fff', borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '700', transition: 'background 0.3s',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.4)', color: '#e50914', padding: '14px 18px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

          {/* LEFT — Poster + Quick Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Poster Preview */}
            <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
              <div style={{
                width: '100%', aspectRatio: '2/3', borderRadius: '8px', overflow: 'hidden',
                background: '#111', marginBottom: '16px', border: '1px solid var(--border)'
              }}>
                {form.thumbnail_url ? (
                  <img src={form.thumbnail_url} alt="Poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🎬</div>
                )}
              </div>
              <Field label="Poster Image URL">
                <input
                  type="url"
                  value={form.thumbnail_url}
                  onChange={e => set('thumbnail_url', e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Backdrop */}
            <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
              <div style={{
                width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden',
                background: '#111', marginBottom: '16px', border: '1px solid var(--border)'
              }}>
                {form.backdrop_url ? (
                  <img src={form.backdrop_url} alt="Backdrop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'var(--text3)' }}>🖼️ Backdrop</div>
                )}
              </div>
              <Field label="Backdrop Image URL">
                <input
                  type="url"
                  value={form.backdrop_url}
                  onChange={e => set('backdrop_url', e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Coming Soon */}
            <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_coming_soon}
                  onChange={e => set('is_coming_soon', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--acc)' }}
                />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>Coming Soon</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>Movie won't be watchable until unchecked</div>
                </div>
              </label>
            </div>
          </div>

          {/* RIGHT — Main Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Core Info */}
            <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>Core Information</h2>

              <Field label="Title">
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} required />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field label="Release Year">
                  <input type="number" value={form.release_year} onChange={e => set('release_year', e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Type">
                  <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
                    <option value="video">Premium Movie</option>
                    <option value="genesis_free_movie">Free Movie</option>
                    <option value="gsm_series">Series Episode</option>
                  </select>
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <Field label="Runtime (min)">
                  <input type="number" value={form.runtime} onChange={e => set('runtime', e.target.value)} style={inputStyle} />
                </Field>
                <Field label="IMDB Rating (/5)">
                  <input type="number" step="0.1" min="0" max="5" value={form.imdb_rating} onChange={e => set('imdb_rating', e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Director">
                  <input type="text" value={form.director} onChange={e => set('director', e.target.value)} style={inputStyle} />
                </Field>
              </div>

              <Field label="Genres (comma separated)">
                <input type="text" value={form.categories} onChange={e => set('categories', e.target.value)} placeholder="Action, Drama, Thriller" style={inputStyle} />
              </Field>

              <Field label="Cast / Actors">
                <input type="text" value={form.actors} onChange={e => set('actors', e.target.value)} placeholder="Actor 1, Actor 2, ..." style={inputStyle} />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </Field>
            </div>

            {/* Video & Trailer */}
            <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>Video Links</h2>

              <Field label="Video URL (Cloudflare / R2)">
                <input type="url" value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://..." style={inputStyle} />
              </Field>

              <Field label="Trailer URL (YouTube)">
                <input type="url" value={form.trailer_url} onChange={e => set('trailer_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} />
              </Field>
            </div>

          </div>
        </div>

        {/* Bottom Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingBottom: '40px' }}>
          <Link href="/admin/movies" style={{ padding: '11px 22px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: '8px', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '11px 28px', background: saved ? '#46b450' : 'var(--acc)',
              border: 'none', color: '#fff', borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '700', transition: 'background 0.3s',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
