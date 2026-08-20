'use client';

import { useState } from 'react';
import { queueCompressionJob, uploadUrlToR2 } from './actions';

export default function UploadClient() {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
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

    try {
      if (uploadMode === 'file') {
        setStatusMsg('Requesting secure upload URL...');
        
        // 1. Get Presigned URL
        const res = await fetch('/api/r2-presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to get upload URL');

        const { url, key } = data;

        setStatusMsg(`Uploading ${file.name} to Cloudflare R2...`);

        // 2. Upload file directly to R2 using XMLHttpRequest to track progress
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

        setStatusMsg('Upload complete!');
        setProgress(100);

        setFile(null);
        // Reset input
        const fileInput = document.getElementById('videoFile');
        if (fileInput) fileInput.value = '';

      } else {
        // Direct Link Mode
        const timestamp = Date.now();
        let rawFilename = videoUrl.split('/').pop().split('?')[0] || `video_${timestamp}.mp4`;
        try {
          rawFilename = decodeURIComponent(rawFilename);
        } catch(e) {}
        const generatedKey = rawFilename;
        
        await new Promise((resolve, reject) => {
          const sse = new EventSource(`/api/upload-direct?url=${encodeURIComponent(videoUrl)}&key=${encodeURIComponent(generatedKey)}`);
          
          sse.onmessage = (event) => {
            try {
              const { type, data } = JSON.parse(event.data);
              if (type === 'progress') {
                setProgress(data);
              } else if (type === 'status') {
                setStatusMsg(data);
              } else if (type === 'error') {
                sse.close();
                reject(new Error(data));
              } else if (type === 'done') {
                sse.close();
                resolve();
              }
            } catch(e) {
              sse.close();
              reject(new Error('Invalid SSE message'));
            }
          };

          sse.onerror = () => {
            sse.close();
            reject(new Error('Connection lost to upload stream'));
          };
        });
        
        setVideoUrl('');
      }

      setStatusMsg(uploadMode === 'file' ? 'Upload complete! Video is now in your Cloudflare R2 bucket.' : 'Direct link streamed to R2 successfully!');
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
    <div style={{ background: 'var(--bg2)', padding: '30px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: '0', color: '#fff' }}>1. Upload Video</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setUploadMode('file')}
            style={{ 
              background: uploadMode === 'file' ? 'var(--acc)' : 'transparent',
              color: '#fff', border: '1px solid var(--acc)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            File Upload
          </button>
          <button 
            onClick={() => setUploadMode('url')}
            style={{ 
              background: uploadMode === 'url' ? 'var(--acc)' : 'transparent',
              color: '#fff', border: '1px solid var(--acc)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            Direct Link
          </button>
        </div>
      </div>
      
      <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>
        {uploadMode === 'file' 
          ? 'Select a raw video file from your computer (.mp4, .mkv). It will be securely uploaded directly to your Cloudflare R2 bucket.'
          : 'Paste a direct link to a video file (.mp4, .mkv). Our background worker will download it straight to R2 without compressing it.'}
      </p>

      <div style={{ marginBottom: '20px' }}>
        {uploadMode === 'file' ? (
          <input 
            type="file" 
            id="videoFile"
            accept="video/mp4,video/x-matroska,video/webm"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        ) : (
          <input 
            type="url" 
            placeholder="https://example.com/movie.mp4"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={uploading}
            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
          />
        )}
      </div>

      <button 
        className="gms-btn gms-btn--primary"
        onClick={handleUpload}
        disabled={(uploadMode === 'file' && !file) || (uploadMode === 'url' && !videoUrl) || uploading}
        style={{ width: '100%', padding: '12px', fontSize: '15px' }}
      >
        {uploading ? (uploadMode === 'file' ? 'Uploading...' : 'Processing...') : (uploadMode === 'file' ? 'Upload Direct to R2' : 'Import Link (Direct Upload)')}
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
          <strong>Success!</strong> {uploadMode === 'file' ? 'The video was securely uploaded to your Cloudflare R2 bucket.' : 'The URL was successfully streamed directly to your Cloudflare R2 bucket!'}
        </div>
      )}
    </div>
  );
}
