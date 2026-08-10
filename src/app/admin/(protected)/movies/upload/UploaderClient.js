'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function UploaderClient() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, presigning, uploading, queuing, success, error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedKey, setUploadedKey] = useState('');
  
  const xhrRef = useRef(null);
  const supabase = createClient();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setProgress(0);
      setErrorMsg('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('presigning');
    setErrorMsg('');

    try {
      // 1. Get Presigned URL
      const res = await fetch('/api/r2-presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, fileType: file.type || 'video/mp4' })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get upload URL');

      const { url, key } = data;
      setUploadedKey(key);
      setStatus('uploading');

      // 2. Upload via XHR to track progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.onabort = () => reject(new Error('Upload canceled'));

        xhr.open('PUT', url, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.send(file);
      });

      // 3. Insert into compression_jobs queue
      setStatus('queuing');
      
      const { error: dbError } = await supabase.from('compression_jobs').insert({
        video_key: key,
        status: 'pending'
      });

      if (dbError) {
        // We uploaded it successfully, but failed to queue. 
        console.error("Queue error:", dbError);
        throw new Error('Video uploaded, but failed to add to compression queue. Try adding manually.');
      }

      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const handleCancel = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  return (
    <div style={{ background: 'var(--bg2)', padding: '30px', borderRadius: '8px' }}>
      
      {status === 'success' ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
          <h2 style={{ color: '#fff', marginBottom: '10px' }}>Upload Complete & Queued</h2>
          <p style={{ color: 'var(--text2)', marginBottom: '25px' }}>
            The raw video has been uploaded to R2 and added to the compression queue.
            <br />
            Make sure your background compressor script is running.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              className="gms-btn gms-btn--secondary"
              onClick={() => {
                setFile(null);
                setStatus('idle');
                setProgress(0);
              }}
            >
              Upload Another
            </button>
            <Link href="/admin/movies/cloudflare-import" className="gms-btn gms-btn--primary">
              View R2 Importer
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div style={{ border: '2px dashed rgba(255,255,255,0.1)', padding: '40px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-upload"
              disabled={status === 'uploading' || status === 'presigning'}
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'inline-block' }}>
              <div style={{ fontSize: '32px', marginBottom: '15px' }}>☁️</div>
              {file ? (
                <div>
                  <h4 style={{ color: '#fff', margin: '0 0 5px' }}>{file.name}</h4>
                  <p style={{ color: 'var(--text3)', margin: 0 }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <h4 style={{ color: '#fff', margin: '0 0 5px' }}>Click to select a video file</h4>
                  <p style={{ color: 'var(--text3)', margin: 0 }}>Supports .mp4, .mkv, .mov</p>
                </div>
              )}
            </label>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', padding: '15px', borderRadius: '4px', color: '#fff', marginBottom: '20px' }}>
              ❌ {errorMsg}
            </div>
          )}

          {status === 'uploading' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px', color: 'var(--text2)' }}>
                <span>Uploading directly to Cloudflare R2...</span>
                <span>{progress}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--acc)', height: '100%', width: `${progress}%`, transition: 'width 0.2s' }}></div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              className="gms-btn gms-btn--primary" 
              disabled={!file || status !== 'idle'} 
              onClick={handleUpload}
              style={{ flex: 1 }}
            >
              {status === 'idle' && 'Start Upload & Compress'}
              {status === 'presigning' && 'Preparing...'}
              {status === 'uploading' && 'Uploading...'}
              {status === 'queuing' && 'Adding to Queue...'}
            </button>
            
            {status === 'uploading' && (
              <button className="gms-btn gms-btn--secondary" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
