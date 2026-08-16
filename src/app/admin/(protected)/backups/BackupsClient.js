'use client';

import { useState, useRef } from 'react';
import { createManualBackup, restoreMissingLinks, uploadBackupFile } from './actions';

export default function BackupsClient({ initialFiles, cdnDomain }) {
  const [files, setFiles] = useState(initialFiles);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [restoreId, setRestoreId] = useState(null);
  const fileInputRef = useRef(null);

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const res = await createManualBackup();
      if (res.error) {
        alert('Error creating backup: ' + res.error);
      } else {
        alert('Backup created successfully: ' + res.fileName);
        window.location.reload();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('backup_file', file);

    try {
      const res = await uploadBackupFile(formData);
      if (res.error) {
        alert('Error uploading backup: ' + res.error);
      } else {
        alert('Backup uploaded successfully!');
        window.location.reload();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestore = async (key) => {
    if (!confirm('Are you sure you want to restore missing links and titles from this backup? This will scan your current database and fill in any blank titles or video URLs using data from this backup file.')) {
      return;
    }
    
    setRestoreId(key);
    try {
      const res = await restoreMissingLinks(key);
      if (res.error) {
        alert('Error restoring: ' + res.error);
      } else {
        alert('Restore complete! Processed ' + res.restoreCount + ' movies.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setRestoreId(null);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ background: 'var(--bg2)', padding: '25px', borderRadius: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', margin: 0 }}>Available Backups</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="file" 
            accept=".json" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="gms-btn"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', fontSize: '14px' }}
          >
            {uploading ? 'Uploading...' : '⬆️ Upload Local Backup'}
          </button>
          <button 
            onClick={handleCreateBackup} 
            disabled={loading}
            className="gms-btn gms-btn--primary"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            {loading ? 'Creating Backup...' : '+ Create Backup Now'}
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <p style={{ color: 'var(--text2)' }}>No backups found in your R2 bucket. Create one to get started!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text2)' }}>
              <th style={{ padding: '15px 10px', fontWeight: '500' }}>File Name</th>
              <th style={{ padding: '15px 10px', fontWeight: '500' }}>Date Created</th>
              <th style={{ padding: '15px 10px', fontWeight: '500' }}>Size</th>
              <th style={{ padding: '15px 10px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.key} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '15px 10px', color: '#fff' }}>
                  {file.key.split('/').pop()}
                </td>
                <td style={{ padding: '15px 10px', color: 'var(--text2)' }}>
                  {new Date(file.lastModified).toLocaleString()}
                </td>
                <td style={{ padding: '15px 10px', color: 'var(--text2)' }}>
                  {formatBytes(file.size)}
                </td>
                <td style={{ padding: '15px 10px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <a 
                    href={`${cdnDomain}/${file.key}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="gms-btn"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', padding: '6px 16px', textDecoration: 'none' }}
                  >
                    Download
                  </a>
                  <button 
                    onClick={() => handleRestore(file.key)}
                    disabled={restoreId === file.key}
                    className="gms-btn"
                    style={{ background: 'rgba(229, 9, 20, 0.2)', color: '#e50914', border: '1px solid rgba(229, 9, 20, 0.5)', fontSize: '13px', padding: '6px 16px' }}
                  >
                    {restoreId === file.key ? 'Restoring...' : 'Restore Missing Links'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
