'use client';

import { useState } from 'react';
import { queueCompressionJob } from './actions';

export default function UploadClient() {
  const [file, setFile] = useState(null);
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
    if (!file) return;
    setUploading(true);
    setErrorMsg('');
    setStatusMsg('Requesting secure upload URL...');
    setProgress(5);

    try {
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

      setStatusMsg('Adding to compression queue...');
      setProgress(98);

      // 3. Add to compression queue
      const queueRes = await queueCompressionJob(key);
      if (queueRes.error) throw new Error(queueRes.error);

      setStatusMsg('Upload complete! Added to Compression Queue.');
      setProgress(100);
      setFile(null);
      // Reset input
      const fileInput = document.getElementById('videoFile');
      if (fileInput) fileInput.value = '';

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
      <h3 style={{ margin: '0 0 15px', color: '#fff' }}>1. Upload Video</h3>
      <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>
        Select a raw video file from your computer (.mp4, .mkv). It will be securely uploaded directly to your Cloudflare R2 bucket.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <input 
          type="file" 
          id="videoFile"
          accept="video/mp4,video/x-matroska,video/webm"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
        />
      </div>

      <button 
        className="gms-btn gms-btn--primary"
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{ width: '100%', padding: '12px', fontSize: '15px' }}
      >
        {uploading ? 'Uploading...' : 'Upload & Compress'}
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
          <strong>Success!</strong> The video was uploaded to R2 and added to the compression queue. Leave your background worker running to process it.
        </div>
      )}
    </div>
  );
}
