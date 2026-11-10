'use client';

import { useState } from 'react';
import { queueCompressionJob, uploadUrlToR2 } from './actions';

export default function UploadClient() {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [provider, setProvider] = useState('b2'); // 'b2' or 'r2'
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
      setStatusMsg('');
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (uploadMode === 'file' && !file) return;
    if (uploadMode === 'url' && !videoUrl) return;
    
    setUploading(true);
    setErrorMsg('');
    setProgress(5);

    const providerName = provider === 'b2' ? 'Backblaze B2' : 'Cloudflare R2';

    try {
      if (uploadMode === 'file') {
        setStatusMsg('Requesting secure upload URL...');
        
        // 1. Get Presigned URL
        const res = await fetch('/api/r2-presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type, provider })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to get upload URL');

        const { url, key } = data;

        setStatusMsg(`Uploading ${file.name} directly to ${providerName}...`);

        // 2. Upload file directly to S3 endpoint using XMLHttpRequest to track progress
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url, true);
          xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 90) + 5; // Scale 5-95%
              setProgress(percentComplete);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(file);
        });

        setStatusMsg(`Upload complete! Video is now saved in ${providerName}.`);
        setProgress(100);

        setFile(null);
        const fileInput = document.getElementById('videoFile');
        if (fileInput) fileInput.value = '';

      } else {
        // Direct Link Mode
        const timestamp = Date.now();
        let rawFilename = videoUrl.split('/').pop().split('?')[0] || `video_${timestamp}.mp4`;
        try {
          rawFilename = decodeURIComponent(rawFilename);
        } catch(e) {}
        const generatedKey = rawFilename.replace(/\s+/g, '-');
        
        await new Promise((resolve, reject) => {
          const sse = new EventSource(`/api/upload-direct?url=${encodeURIComponent(videoUrl)}&key=${encodeURIComponent(generatedKey)}&provider=${provider}`);
          
          sse.onmessage = (event) => {
            try {
              const { type, data } = JSON.parse(event.data);
              if (type === 'progress') {
                setProgress(data);
              } else if (type === 'status') {
                setStatusMsg(data);
              } else if (type === 'complete') {
                sse.close();
                resolve();
              } else if (type === 'error') {
                sse.close();
                reject(new Error(data));
              }
            } catch (err) {
              sse.close();
              reject(err);
            }
          };

          sse.onerror = () => {
            sse.close();
            reject(new Error('Connection lost while streaming video link.'));
          };
        });

        setVideoUrl('');
      }

      setStatusMsg(uploadMode === 'file' ? `Upload complete! Video is now in your ${providerName} bucket.` : `Direct link streamed to ${providerName} successfully!`);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setStatusMsg('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg2)', padding: '30px', borderRadius: '10px', border: '1px solid var(--border)' }}>
      {/* Header & Mode Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: '0', color: '#fff', fontSize: '18px', fontWeight: '700' }}>Direct Video Upload</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button"
            onClick={() => setUploadMode('file')}
            style={{ 
              background: uploadMode === 'file' ? 'var(--acc)' : 'transparent',
              color: '#fff', border: '1px solid var(--acc)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
            }}
          >
            File Upload
          </button>
          <button 
            type="button"
            onClick={() => setUploadMode('url')}
            style={{ 
              background: uploadMode === 'url' ? 'var(--acc)' : 'transparent',
              color: '#fff', border: '1px solid var(--acc)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
            }}
          >
            Direct URL Stream
          </button>
        </div>
      </div>

      {/* Destination Bucket Switcher */}
      <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Destination Cloud Storage:
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setProvider('b2')}
            style={{
              background: provider === 'b2' ? '#9333ea' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: provider === 'b2' ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.1)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🟣 Backblaze B2</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>(flixonvideos)</span>
          </button>
          <button
            type="button"
            onClick={() => setProvider('r2')}
            style={{
              background: provider === 'r2' ? '#ea580c' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: provider === 'r2' ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.1)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🟠 Cloudflare R2</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>(movies)</span>
          </button>
        </div>
      </div>
      
      <p style={{ color: 'var(--text2)', marginBottom: '20px', fontSize: '13px', lineHeight: '1.5' }}>
        {uploadMode === 'file' 
          ? `Select a raw video file from your computer (.mp4, .mkv). It will be securely uploaded directly to your ${provider === 'b2' ? 'Backblaze B2' : 'Cloudflare R2'} bucket.`
          : `Paste a direct link to a video file (.mp4, .mkv). Our background worker will stream it straight to ${provider === 'b2' ? 'Backblaze B2' : 'Cloudflare R2'} with real-time progress.`}
      </p>

      <div style={{ marginBottom: '20px' }}>
        {uploadMode === 'file' ? (
          <input 
            type="file" 
            id="videoFile"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ 
              width: '100%', 
              padding: '20px', 
              border: '2px dashed #444', 
              borderRadius: '6px',
              background: '#111',
              color: 'var(--text2)',
              cursor: 'pointer'
            }} 
          />
        ) : (
          <input 
            type="url"
            placeholder="https://example.com/movie-source.mp4"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={uploading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '4px', 
              border: '1px solid #444', 
              background: '#111', 
              color: '#fff',
              fontSize: '14px'
            }}
          />
        )}
      </div>

      <button 
        className="gms-btn gms-btn--primary" 
        onClick={handleUpload}
        disabled={(uploadMode === 'file' && !file) || (uploadMode === 'url' && !videoUrl) || uploading}
        style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700' }}
      >
        {uploading 
          ? (uploadMode === 'file' ? 'Uploading...' : 'Processing...') 
          : (uploadMode === 'file' ? `Upload to ${provider === 'b2' ? 'Backblaze B2' : 'Cloudflare R2'}` : `Stream Link to ${provider === 'b2' ? 'Backblaze B2' : 'Cloudflare R2'}`)}
      </button>

      {errorMsg && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', borderRadius: '4px', color: '#fff' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {uploading && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'var(--text2)' }}>
            <span>{statusMsg}</span>
            <span>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--acc)', transition: 'width 0.3s' }}></div>
          </div>
        </div>
      )}

      {progress === 100 && !errorMsg && !uploading && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(70, 180, 80, 0.1)', border: '1px solid #46b450', borderRadius: '4px', color: '#fff' }}>
          <strong>Success!</strong> {uploadMode === 'file' ? `The video was securely uploaded to your ${provider === 'b2' ? 'Backblaze B2' : 'Cloudflare R2'} bucket.` : `The URL was successfully streamed directly to your ${provider === 'b2' ? 'Backblaze B2' : 'Cloudflare R2'} bucket!`}
        </div>
      )}
    </div>
  );
}
