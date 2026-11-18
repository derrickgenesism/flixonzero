'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

const GRADIENT_PRESETS = [
  { name: 'Crimson Flame', value: 'linear-gradient(135deg, #f43f5e, #fb923c)' },
  { name: 'Amber Gold', value: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { name: 'Cyan Wave', value: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
  { name: 'Purple Neon', value: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
  { name: 'Emerald Vault', value: 'linear-gradient(135deg, #10b981, #06b6d4)' },
  { name: 'Royal Violet', value: 'linear-gradient(135deg, #a855f7, #6366f1)' },
];

export default function DownloadsAdminClient({ initialApps = [], storageInfo = {} }) {
  const [apps, setApps] = useState(initialApps);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'b2_hosted', 'external'
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null); // null = new, object = editing

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formCategory, setFormCategory] = useState('Video Downloader');
  const [formBadge, setFormBadge] = useState('MOD / NO ADS');
  const [formDescription, setFormDescription] = useState('');
  const [formGradient, setFormGradient] = useState(GRADIENT_PRESETS[0].value);
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formFileSize, setFormFileSize] = useState('');
  const [formStorageKey, setFormStorageKey] = useState('');
  const [formStorageProvider, setFormStorageProvider] = useState('b2');

  // File Upload State (New / Edit)
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);

  // Quick Replace File Modal State
  const [replaceTargetApp, setReplaceTargetApp] = useState(null);
  const replaceFileInputRef = useRef(null);
  const [replaceProgress, setReplaceProgress] = useState(0);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceStatus, setReplaceStatus] = useState('');

  // Blogger Embed Modal State
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // Open Add Modal
  function handleOpenAdd() {
    setEditingApp(null);
    setFormName('');
    setFormVersion('v1.0');
    setFormCategory('Video Downloader');
    setFormBadge('MOD / NO ADS');
    setFormDescription('High-speed Android application. Free from ads, clean and fast.');
    setFormGradient(GRADIENT_PRESETS[0].value);
    setFormFileUrl('');
    setFormFileSize('');
    setFormStorageKey('');
    setFormStorageProvider(storageInfo.provider || 'b2');
    setUploadProgress(0);
    setUploadStatus('');
    setIsModalOpen(true);
  }

  // Open Edit Modal
  function handleOpenEdit(app) {
    setEditingApp(app);
    setFormName(app.name || '');
    setFormVersion(app.version || '');
    setFormCategory(app.category || 'Utility');
    setFormBadge(app.badge || 'MOD / NO ADS');
    setFormDescription(app.description || '');
    setFormGradient(app.gradient || GRADIENT_PRESETS[0].value);
    setFormFileUrl(app.file_url || '');
    setFormFileSize(app.file_size || '');
    setFormStorageKey(app.storage_key || '');
    setFormStorageProvider(app.storage_provider || 'b2');
    setUploadProgress(0);
    setUploadStatus('');
    setIsModalOpen(true);
  }

  // Upload file directly to S3 / Backblaze B2
  async function performStorageUpload(fileObj, appKey) {
    if (!fileObj) throw new Error('No file selected');

    // 1. Get Presigned S3 URL
    const presignRes = await fetch('/api/admin/shared-apps/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: fileObj.name,
        contentType: fileObj.type || 'application/vnd.android.package-archive',
        provider: storageInfo.provider || 'b2',
        appKey: appKey || 'app'
      })
    });

    const presignData = await presignRes.json();
    if (!presignRes.ok || !presignData.success) {
      throw new Error(presignData.error || 'Failed to get upload signature');
    }

    const { uploadUrl, fileUrl, storageKey } = presignData;

    // 2. Upload directly to B2 via XHR to report percentage
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', fileObj.type || 'application/vnd.android.package-archive');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
          const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
          const totalMB = (e.total / (1024 * 1024)).toFixed(1);
          setUploadProgress(percent);
          setUploadStatus(`Uploading: ${percent}% (${loadedMB} MB / ${totalMB} MB)`);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          setUploadStatus('Upload complete! Saved to Storage.');
          resolve();
        } else {
          reject(new Error(`Storage server returned HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error uploading to storage'));
      xhr.onabort = () => reject(new Error('Upload aborted'));
      xhr.send(fileObj);
    });

    const sizeFormatted = formatFileSize(fileObj.size);
    return { fileUrl, storageKey, sizeFormatted };
  }

  // Handle File Input Selection in Add/Edit Modal
  async function handleModalFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(1);
    setUploadStatus('Initializing storage connection...');

    try {
      const autoSlug = (formName || file.name.replace(/\.[^/.]+$/, ''))
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');

      const result = await performStorageUpload(file, autoSlug);
      setFormFileUrl(result.fileUrl);
      setFormFileSize(result.sizeFormatted);
      setFormStorageKey(result.storageKey);

      // Auto-populate form name if empty
      if (!formName) {
        setFormName(cleanFileNameToTitle(file.name));
      }
      showToast('File uploaded to Backblaze B2!');
    } catch (err) {
      alert(`Upload error: ${err.message}`);
      setUploadStatus(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  // Handle Quick File Replace on an existing App
  async function handleQuickReplace(e) {
    const file = e.target.files?.[0];
    if (!file || !replaceTargetApp) return;

    setIsReplacing(true);
    setReplaceProgress(1);
    setReplaceStatus('Connecting to storage...');

    try {
      // 1. Presign
      const presignRes = await fetch('/api/admin/shared-apps/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/vnd.android.package-archive',
          provider: storageInfo.provider || 'b2',
          appKey: replaceTargetApp.id
        })
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok || !presignData.success) {
        throw new Error(presignData.error || 'Failed to prepare upload');
      }

      const { uploadUrl, fileUrl, storageKey } = presignData;

      // 2. Direct XHR upload
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/vnd.android.package-archive');

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
            const loadedMB = (evt.loaded / (1024 * 1024)).toFixed(1);
            const totalMB = (evt.total / (1024 * 1024)).toFixed(1);
            setReplaceProgress(pct);
            setReplaceStatus(`Uploading: ${pct}% (${loadedMB} MB / ${totalMB} MB)`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setReplaceProgress(100);
            setReplaceStatus('Upload complete!');
            resolve();
          } else {
            reject(new Error(`Storage error ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload'));
        xhr.send(file);
      });

      const sizeFormatted = formatFileSize(file.size);

      // 3. Update app in list
      const updatedApps = apps.map(app => {
        if (app.id === replaceTargetApp.id) {
          return {
            ...app,
            file_url: fileUrl,
            storage_key: storageKey,
            storage_provider: storageInfo.provider || 'b2',
            file_size: sizeFormatted,
            updated_at: new Date().toISOString()
          };
        }
        return app;
      });

      await saveAppsList(updatedApps);
      setApps(updatedApps);
      showToast(`⚡ ${replaceTargetApp.name} updated with new APK!`);
      setReplaceTargetApp(null);
    } catch (err) {
      alert(`Replace failed: ${err.message}`);
    } finally {
      setIsReplacing(false);
      setReplaceProgress(0);
      setReplaceStatus('');
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  }

  // Save Modal Form (Add or Edit)
  async function handleSaveModal(e) {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter an app name.');
      return;
    }
    if (!formFileUrl.trim()) {
      alert('Please provide a file URL or upload a file directly to storage.');
      return;
    }

    const slug = (editingApp?.id || formName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const newOrUpdatedApp = {
      id: slug,
      name: formName.trim(),
      version: formVersion.trim() || 'v1.0',
      category: formCategory.trim() || 'Utility',
      badge: formBadge.trim() || 'PREMIUM',
      description: formDescription.trim(),
      gradient: formGradient,
      file_url: formFileUrl.trim(),
      file_size: formFileSize.trim() || 'Unknown',
      storage_key: formStorageKey || '',
      storage_provider: formStorageProvider || 'b2',
      download_count: editingApp ? (editingApp.download_count || 0) : 0,
      is_active: editingApp ? editingApp.is_active : true,
      created_at: editingApp?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let updatedList;
    if (editingApp) {
      updatedList = apps.map(a => a.id === editingApp.id ? newOrUpdatedApp : a);
    } else {
      updatedList = [newOrUpdatedApp, ...apps];
    }

    const ok = await saveAppsList(updatedList);
    if (ok) {
      setApps(updatedList);
      setIsModalOpen(false);
      showToast(editingApp ? 'App updated successfully!' : 'New app added to storage & download hub!');
    }
  }

  // Toggle App Active Status
  async function handleToggleActive(appId) {
    const updated = apps.map(a => a.id === appId ? { ...a, is_active: !a.is_active } : a);
    setApps(updated);
    await saveAppsList(updated);
    showToast('Visibility updated.');
  }

  // Delete App
  async function handleDelete(appId, appName) {
    if (!confirm(`Are you sure you want to remove "${appName}" from downloads?`)) return;
    const updated = apps.filter(a => a.id !== appId);
    setApps(updated);
    await saveAppsList(updated);
    showToast(`Removed "${appName}".`);
  }

  // Save Apps List to Backend
  async function saveAppsList(listToSave) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/shared-apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apps: listToSave })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }
      return true;
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Filtered Apps
  const filteredApps = apps.filter(app => {
    const matchesSearch = !searchTerm || 
      app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.version?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'b2_hosted') {
      return app.file_url?.includes('cdn.flixon.net') || Boolean(app.storage_key);
    }
    if (activeTab === 'external') {
      return !app.file_url?.includes('cdn.flixon.net') && !app.storage_key;
    }
    return true;
  });

  const totalDownloads = apps.reduce((sum, a) => sum + (Number(a.download_count) || 0), 0);
  const directB2Count = apps.filter(a => a.file_url?.includes('cdn.flixon.net') || Boolean(a.storage_key)).length;

  // Generate Blogger Embed HTML Code
  function generateBloggerEmbedHtml() {
    const activeList = apps.filter(a => a.is_active !== false);
    const primaryApp = activeList[0] || {
      id: 'app',
      name: 'Android App',
      file_url: 'https://flixon.net/downloads',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)'
    };

    const tabsHtml = activeList.map((app, idx) => `
      <!-- Tab: ${escapeHtml(app.name)} -->
      <button type="button" class="dl-app-tab ${idx === 0 ? 'is-active' : ''}" role="tab" aria-selected="${idx === 0 ? 'true' : 'false'}" data-app-key="${app.id}">
        <div class="dl-app-icon" style="background: ${app.gradient || 'linear-gradient(135deg, #10b981, #06b6d4)'} !important;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
          </svg>
        </div>
        <span class="dl-app-tab-label">${escapeHtml(app.name)}</span>
      </button>`).join('\n');

    const appDict = activeList.reduce((acc, app) => {
      acc[app.id] = {
        label: app.name,
        url: app.file_url,
        gradient: app.gradient || 'linear-gradient(135deg, #10b981, #06b6d4)',
        svg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>'
      };
      return acc;
    }, {});

    return `<!-- 
  ==========================================================================
  FLIXON DOWNLOADERS PREMIUM & WATCH FREE MOVIES ALL VJs - BLOGGER HARDENED
  Direct B2 CDN Storage Downloads + Dynamic FlixOn Free Movies Cinema Showcase
  ==========================================================================
-->
<div id="dl-premium-hub" class="dl-premium-hub">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
    #dl-premium-hub.dl-premium-hub {
      --bg-obsidian: #090a0f;
      --bg-panel: #10131d;
      --bg-glass: rgba(18, 22, 34, 0.92);
      --border-glass: rgba(255, 255, 255, 0.11);
      --emerald: #10b981;
      --cyan: #06b6d4;
      --crimson: #f43f5e;
      --gold: #f59e0b;
      --text-white: #ffffff;
      --text-slate: #cbd5e1;
      --font-head: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 24px 16px 36px !important;
      box-sizing: border-box !important;
      overflow-x: hidden !important;
      position: relative !important;
      container-type: inline-size !important;
      container-name: dlhub !important;
      font-family: var(--font-body) !important;
      color: var(--text-white) !important;
      background: radial-gradient(circle at 12% 0%, rgba(16, 185, 129, 0.18), transparent 38%), radial-gradient(circle at 88% 12%, rgba(244, 63, 94, 0.16), transparent 40%), #090a0f !important;
      border-radius: 22px !important;
      border: 1px solid rgba(255, 255, 255, 0.11) !important;
      box-shadow: 0 24px 60px -15px rgba(0, 0, 0, 0.85) !important;
    }
    #dl-premium-hub * { box-sizing: border-box !important; }
    #dl-premium-hub a { text-decoration: none !important; }
    #dl-premium-hub .dl-header { text-align: center !important; margin: 0 0 22px 0 !important; }
    #dl-premium-hub .dl-title {
      font-family: var(--font-head) !important;
      font-size: clamp(1.75rem, 4.5vw, 2.85rem) !important;
      font-weight: 900 !important;
      margin: 0 !important;
      line-height: 1.1 !important;
      background: linear-gradient(135deg, #ffffff 20%, #6ee7b7 60%, #38bdf8 95%) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
    }
    #dl-premium-hub .dl-tabs-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 11px !important;
      margin: 0 0 15px 0 !important;
    }
    @container dlhub (min-width: 560px) {
      #dl-premium-hub .dl-tabs-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    }
    #dl-premium-hub .dl-app-tab {
      background: rgba(18, 22, 34, 0.92) !important;
      border: 1.5px solid rgba(255, 255, 255, 0.11) !important;
      border-radius: 16px !important;
      padding: 14px 8px !important;
      cursor: pointer !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 9px !important;
      color: #fff !important;
      transition: all 0.22s ease !important;
    }
    #dl-premium-hub .dl-app-tab.is-active {
      background: linear-gradient(160deg, rgba(16, 185, 129, 0.24), rgba(6, 182, 212, 0.15)) !important;
      border-color: #10b981 !important;
      box-shadow: 0 10px 26px -6px rgba(16, 185, 129, 0.45) !important;
    }
    #dl-premium-hub .dl-app-icon {
      width: 46px !important;
      height: 46px !important;
      border-radius: 14px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 8px 18px rgba(0,0,0,0.45) !important;
    }
    #dl-premium-hub .dl-app-tab-label {
      font-family: var(--font-head) !important;
      font-size: 13.5px !important;
      font-weight: 800 !important;
      text-align: center !important;
    }
    #dl-premium-hub .dl-instant-bar {
      background: linear-gradient(145deg, #111726 0%, #0b0f19 100%) !important;
      border: 1.5px solid rgba(16, 185, 129, 0.5) !important;
      border-radius: 20px !important;
      padding: 18px !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 15px !important;
    }
    @container dlhub (min-width: 580px) {
      #dl-premium-hub .dl-instant-bar {
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
      }
    }
    #dl-premium-hub .dl-selected-info { display: flex !important; align-items: center !important; gap: 13px !important; }
    #dl-premium-hub .dl-selected-icon {
      width: 52px !important;
      height: 52px !important;
      border-radius: 15px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    #dl-premium-hub .dl-selected-name {
      font-family: var(--font-head) !important;
      font-size: clamp(1.2rem, 2.8vw, 1.55rem) !important;
      font-weight: 900 !important;
      margin: 0 0 5px 0 !important;
      color: #fff !important;
    }
    #dl-premium-hub .dl-selected-url {
      font-size: 12px !important;
      color: #34d399 !important;
      background: rgba(16, 185, 129, 0.13) !important;
      border: 1px solid rgba(16, 185, 129, 0.28) !important;
      padding: 4px 10px !important;
      border-radius: 8px !important;
      display: inline-block !important;
      max-width: 280px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
    #dl-premium-hub .dl-cta-wrapper { display: flex !important; align-items: center !important; gap: 10px !important; }
    #dl-premium-hub .dl-pointer-cue {
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      background: rgba(16, 185, 129, 0.18) !important;
      border: 1px solid rgba(52, 211, 153, 0.5) !important;
      color: #6ee7b7 !important;
      font-size: 12px !important;
      font-weight: 800 !important;
      padding: 7px 11px !important;
      border-radius: 999px !important;
      animation: dlPointRight 0.9s infinite ease-in-out !important;
    }
    #dl-premium-hub .dl-download-cta {
      display: inline-flex !important;
      align-items: center !important;
      gap: 9px !important;
      padding: 15px 24px !important;
      border-radius: 14px !important;
      font-family: var(--font-head) !important;
      font-size: 15px !important;
      font-weight: 900 !important;
      color: #03150e !important;
      background: linear-gradient(135deg, #10b981 0%, #34d399 48%, #06b6d4 100%) !important;
      box-shadow: 0 12px 30px -4px rgba(16, 185, 129, 0.65) !important;
      cursor: pointer !important;
    }
    #dl-premium-hub .dl-cinema-section {
      margin: 28px 0 0 0 !important;
      padding: 24px 0 0 0 !important;
      border-top: 1px solid rgba(255, 255, 255, 0.11) !important;
    }
    #dl-premium-hub .dl-cinema-title {
      font-family: var(--font-head) !important;
      font-size: clamp(1.3rem, 3vw, 1.75rem) !important;
      font-weight: 900 !important;
      margin: 0 0 18px 0 !important;
      color: #fff !important;
    }
    #dl-premium-hub .dl-movies-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(235px, 1fr)) !important;
      gap: 18px !important;
    }
    #dl-premium-hub .dl-cinema-card {
      background: linear-gradient(165deg, #170c18 0%, #0e101c 60%, #090b12 100%) !important;
      border: 1.5px solid rgba(244, 63, 94, 0.45) !important;
      border-radius: 20px !important;
      overflow: hidden !important;
      color: #fff !important;
      display: flex !important;
      flex-direction: column !important;
    }
    #dl-premium-hub .dl-cinema-card:hover { transform: translateY(-4px) !important; border-color: #fb7185 !important; }
    #dl-premium-hub .dl-visual { height: 165px !important; position: relative !important; overflow: hidden !important; }
    #dl-premium-hub .dl-visual img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
    #dl-premium-hub .dl-card-body { padding: 16px !important; display: flex !important; flex-direction: column !important; gap: 8px !important; flex: 1 !important; }
    #dl-premium-hub .dl-card-h { font-family: var(--font-head) !important; font-size: 1.2rem !important; font-weight: 800 !important; margin: 0 !important; color: #fff !important; }
    #dl-premium-hub .dl-card-p { font-size: 12.5px !important; color: #cbd5e1 !important; margin: 0 !important; }
    #dl-premium-hub .dl-vj-pills { display: flex !important; gap: 5px !important; flex-wrap: wrap !important; }
    #dl-premium-hub .dl-vj-pill { font-size: 10.5px !important; font-weight: 700 !important; background: rgba(245, 158, 11, 0.16) !important; color: #fde68a !important; padding: 3px 8px !important; border-radius: 6px !important; border: 1px solid rgba(245, 158, 11, 0.3) !important; }
    #dl-premium-hub .dl-play-btn {
      margin-top: auto !important;
      background: linear-gradient(135deg, #f43f5e 0%, #e11d48 52%, #f59e0b 100%) !important;
      color: #fff !important;
      font-family: var(--font-head) !important;
      font-size: 13px !important;
      font-weight: 900 !important;
      padding: 12px !important;
      border-radius: 12px !important;
      text-align: center !important;
      display: block !important;
      box-shadow: 0 10px 24px -5px rgba(244, 63, 94, 0.65) !important;
    }
    @keyframes dlPointRight { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(6px); } }
  </style>

  <header class="dl-header">
    <h1 class="dl-title">Downloaders Premium</h1>
  </header>

  <section class="dl-apps-section">
    <div class="dl-tabs-grid" role="tablist">
${tabsHtml}
    </div>

    <div class="dl-instant-bar" id="dl-instant-bar">
      <div class="dl-selected-info">
        <div id="dl-selected-icon" class="dl-selected-icon" style="background: ${primaryApp.gradient} !important;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
          </svg>
        </div>
        <div>
          <h2 id="dl-selected-name" class="dl-selected-name">${escapeHtml(primaryApp.name)}</h2>
          <span id="dl-selected-url" class="dl-selected-url">${escapeHtml(primaryApp.file_url)}</span>
        </div>
      </div>
      <div class="dl-cta-wrapper">
        <span class="dl-pointer-cue"><span>Tap here</span><span>👉</span></span>
        <a id="dl-download-cta" href="${escapeHtml(primaryApp.file_url)}" target="_blank" rel="noopener noreferrer" download class="dl-download-cta">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>DOWNLOAD NOW</span>
        </a>
      </div>
    </div>
  </section>

  <section class="dl-cinema-section">
    <h2 class="dl-cinema-title">🎬 Watch Free Movies • All VJs</h2>
    <div class="dl-movies-grid">
      <!-- Movie Card 1 -->
      <a href="https://flixon.net/?category=Free" target="_blank" rel="noopener noreferrer" class="dl-cinema-card">
        <div class="dl-visual">
          <img src="https://thefilmstage.com/wp-content/uploads/2017/02/Shoot-Em-Up.jpg" alt="Free Movies VJ Junior" onerror="this.style.display='none'" />
        </div>
        <div class="dl-card-body">
          <h3 class="dl-card-h">Action Blockbusters</h3>
          <p class="dl-card-p">Stream full-length translated hits by VJ Junior, VJ Emmy & VJ Ice P with 0 sign-up.</p>
          <div class="dl-vj-pills"><span class="dl-vj-pill">VJ Junior</span><span class="dl-vj-pill">VJ Emmy</span><span class="dl-vj-pill">Free Access</span></div>
          <span class="dl-play-btn">WATCH FREE NOW ▶</span>
        </div>
      </a>
      <!-- Movie Card 2 -->
      <a href="https://flixon.net/?category=New%20Arrivals" target="_blank" rel="noopener noreferrer" class="dl-cinema-card">
        <div class="dl-visual">
          <img src="https://static0.colliderimages.com/wordpress/wp-content/uploads/2021/05/mark-wahlberg-mile-22-social.jpg?q=70&fit=crop&w=825&dpr=1" alt="New Arrivals FlixOn" onerror="this.style.display='none'" />
        </div>
        <div class="dl-card-body">
          <h3 class="dl-card-h">Trending Translated Series</h3>
          <p class="dl-card-p">Non-stop episodes and brand new Luganda releases updated daily on FlixOn.</p>
          <div class="dl-vj-pills"><span class="dl-vj-pill">VJ Jingo</span><span class="dl-vj-pill">VJ Mark</span><span class="dl-vj-pill">HD 1080p</span></div>
          <span class="dl-play-btn">STREAM ON FLIXON ▶</span>
        </div>
      </a>
    </div>
  </section>

  <script>
    (function () {
      const APP_LINKS = ${JSON.stringify(appDict, null, 2)};
      const hub = document.getElementById("dl-premium-hub");
      if (!hub) return;
      const tabs = hub.querySelectorAll(".dl-app-tab");
      const selectedIcon = hub.querySelector("#dl-selected-icon");
      const selectedName = hub.querySelector("#dl-selected-name");
      const selectedUrl = hub.querySelector("#dl-selected-url");
      const downloadCta = hub.querySelector("#dl-download-cta");

      function activateApp(key) {
        const item = APP_LINKS[key];
        if (!item) return;
        tabs.forEach(tab => {
          const isMatch = tab.getAttribute("data-app-key") === key;
          tab.classList.toggle("is-active", isMatch);
          tab.setAttribute("aria-selected", isMatch ? "true" : "false");
        });
        selectedIcon.style.setProperty("background", item.gradient, "important");
        selectedName.textContent = item.label;
        selectedUrl.textContent = item.url;
        downloadCta.href = item.url;
      }
      tabs.forEach(tab => {
        tab.addEventListener("click", () => activateApp(tab.getAttribute("data-app-key")));
      });
      const firstKey = Object.keys(APP_LINKS)[0];
      if (firstKey) activateApp(firstKey);
    })();
  </script>
</div>`;
  }

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', color: '#fff' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          color: '#000',
          fontWeight: '700',
          padding: '12px 20px',
          borderRadius: '10px',
          zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toast}
        </div>
      )}

      {/* Hidden inputs for file uploads */}
      <input 
        type="file" 
        ref={replaceFileInputRef} 
        onChange={handleQuickReplace} 
        accept=".apk,.zip,.rar,.tar,.gz,.bin,.exe" 
        style={{ display: 'none' }} 
      />

      {/* Header & Quick Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>📲</span>
            <h1 style={{ fontSize: '26px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>
              App Downloads & Storage Hub
            </h1>
          </div>
          <p style={{ color: 'var(--text3)', margin: 0, fontSize: '14px' }}>
            Upload APKs and downloadable files directly to Backblaze B2 storage, share fast direct links, and convert download traffic into FlixOn free movie viewers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsEmbedModalOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📋</span>
            <span>Blogger / Embed Code</span>
          </button>

          <Link
            href="/downloads"
            target="_blank"
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🌐</span>
            <span>View Public Download Hub ↗</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              background: 'linear-gradient(135deg, #e50914, #ff3b30)',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(229, 9, 20, 0.4)'
            }}
          >
            <span>➕</span>
            <span>Upload New App / File</span>
          </button>
        </div>
      </div>

      {/* Storage & Analytics Overview Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '26px'
      }}>
        <div style={{ background: 'var(--bg2)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px' }}>Total Shared Apps</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff' }}>{apps.length}</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>● {apps.filter(a => a.is_active !== false).length} Active on Public Page</div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px' }}>Direct Storage Uploads</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8' }}>{directB2Count}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Hosted on Backblaze B2 (CDN: cdn.flixon.net)</div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px' }}>Total Downloads Recorded</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#f59e0b' }}>{totalDownloads.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>All app downloads tracked in real time</div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px' }}>Active Storage Provider</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', textTransform: 'uppercase' }}>
            {storageInfo.provider === 'b2' ? 'Backblaze B2' : 'Cloudflare R2'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px', wordBreak: 'break-all' }}>
            Bucket: {storageInfo.provider === 'b2' ? storageInfo.b2Bucket : storageInfo.r2Bucket}
          </div>
        </div>
      </div>

      {/* Quick Replace Banner / Progress (if replacing) */}
      {isReplacing && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
          border: '1.5px solid #10b981',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: '800', color: '#10b981' }}>⚡ Replacing APK for {replaceTargetApp?.name}...</span>
            <span style={{ fontWeight: '700' }}>{replaceProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${replaceProgress}%`, height: '100%', background: '#10b981', transition: 'width 0.2s' }} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px' }}>{replaceStatus}</div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: `All Apps (${apps.length})` },
            { id: 'b2_hosted', label: `B2 Storage Files (${directB2Count})` },
            { id: 'external', label: `External Links (${apps.length - directB2Count})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? 'var(--acc)' : 'rgba(255,255,255,0.05)',
                color: activeTab === t.id ? '#fff' : 'var(--text2)',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by app name or category..."
          style={{
            background: 'var(--bg2)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            padding: '9px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            width: '260px'
          }}
        />
      </div>

      {/* Apps Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '18px'
      }}>
        {filteredApps.map((app) => {
          const isDirectStorage = app.file_url?.includes('cdn.flixon.net') || Boolean(app.storage_key);

          return (
            <div
              key={app.id}
              style={{
                background: 'var(--bg2)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                position: 'relative',
                transition: 'border-color 0.2s',
                opacity: app.is_active === false ? 0.6 : 1
              }}
            >
              {/* Card Header: Icon + Name + Version + Badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: app.gradient || 'linear-gradient(135deg, #10b981, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 18px rgba(0,0,0,0.4)'
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
                  </svg>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#fff', wordBreak: 'break-word' }}>
                      {app.name}
                    </h3>
                    {app.badge && (
                      <span style={{
                        background: 'rgba(244, 63, 94, 0.15)',
                        border: '1px solid rgba(244, 63, 94, 0.4)',
                        color: '#fb7185',
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        {app.badge}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: 'var(--text3)' }}>
                    <span style={{ color: '#fff', fontWeight: '700' }}>{app.version || 'v1.0'}</span>
                    <span>•</span>
                    <span>{app.file_size || 'Unknown Size'}</span>
                    <span>•</span>
                    <span style={{ color: '#38bdf8' }}>{app.category}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {app.description && (
                <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>
                  {app.description}
                </p>
              )}

              {/* Storage Link Pill & Download Count */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', color: isDirectStorage ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{isDirectStorage ? '⚡ B2 CDN STORAGE' : '🔗 EXTERNAL URL'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.file_url}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: '700' }}>Downloads</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                    {(Number(app.download_count) || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {/* 1-Click Replace / Update File */}
                <button
                  type="button"
                  onClick={() => {
                    setReplaceTargetApp(app);
                    if (replaceFileInputRef.current) {
                      replaceFileInputRef.current.click();
                    }
                  }}
                  title="Upload a new APK to replace this file in B2 storage without changing URLs"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>⚡</span>
                  <span>Update APK File</span>
                </button>

                {/* Edit Details */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(app)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✏ Edit
                </button>

                {/* Copy Direct Link */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(app.file_url);
                    showToast('Direct file link copied!');
                  }}
                  title="Copy direct file download URL"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🔗 Copy Link
                </button>

                {/* Open in Downloads Hub */}
                <Link
                  href={`/downloads?app=${encodeURIComponent(app.id)}`}
                  target="_blank"
                  title="Preview in Public Download Hub"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  ↗ Preview
                </Link>

                {/* Toggle Active / Hide */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(app.id)}
                  title={app.is_active !== false ? 'Hide from public download page' : 'Show on public download page'}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: app.is_active !== false ? '#10b981' : 'var(--text3)',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {app.is_active !== false ? '👁 Active' : '✕ Hidden'}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(app.id, app.name)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginLeft: 'auto'
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredApps.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg2)',
          borderRadius: '16px',
          border: '1px dashed rgba(255,255,255,0.1)',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px' }}>No apps found</h3>
          <p style={{ color: 'var(--text3)', fontSize: '14px', margin: '0 0 20px' }}>
            Upload your first Android app or modded downloader directly to Backblaze B2 storage.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              background: 'var(--acc)',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ➕ Upload New App
          </button>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD NEW APP OR EDIT EXISTING APP
          ======================================================== */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#141724',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{editingApp ? '✏' : '☁️'}</span>
                <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#fff' }}>
                  {editingApp ? `Edit ${editingApp.name}` : 'Upload App to Storage & Downloads'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Direct B2 File Upload Dropzone */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1.5px dashed rgba(16, 185, 129, 0.4)',
                borderRadius: '14px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>📁</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#10b981', marginBottom: '4px' }}>
                  {isUploading ? 'Uploading to Backblaze B2 Storage...' : 'Direct Storage Upload (APK / ZIP)'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '14px' }}>
                  Files upload directly from your browser to your Backblaze B2 bucket (routed via cdn.flixon.net).
                </div>

                {isUploading ? (
                  <div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#10b981', transition: 'width 0.2s' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#fff', fontWeight: '700' }}>{uploadStatus}</div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleModalFileChange}
                      accept=".apk,.zip,.rar,.tar,.gz,.bin,.exe"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                        border: 'none',
                        color: '#000',
                        fontWeight: '800',
                        fontSize: '13px',
                        padding: '9px 18px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Choose APK File to Upload
                    </button>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: 'var(--text2)' }}>
                    App Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Vidmate No Ads or FlixOn Mod"
                    style={{ width: '100%', background: '#0b0e17', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: 'var(--text2)' }}>
                    Version
                  </label>
                  <input
                    type="text"
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    placeholder="e.g. v5.24"
                    style={{ width: '100%', background: '#0b0e17', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: 'var(--text2)' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Video Downloader"
                    style={{ width: '100%', background: '#0b0e17', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: 'var(--text2)' }}>
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="e.g. MOD / NO ADS, FAST DL"
                    style={{ width: '100%', background: '#0b0e17', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: 'var(--text2)' }}>
                  Download File URL * (Auto-filled by Storage Upload or custom)
                </label>
                <input
                  type="url"
                  required
                  value={formFileUrl}
                  onChange={(e) => setFormFileUrl(e.target.value)}
                  placeholder="https://cdn.flixon.net/apps/your-app.apk"
                  style={{ width: '100%', background: '#0b0e17', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#34d399', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: 'var(--text2)' }}>
                    File Size (Display)
                  </label>
                  <input
                    type="text"
                    value={formFileSize}
                    onChange={(e) => setFormFileSize(e.target.value)}
                    placeholder="e.g. 24.5 MB"
                    style={{ width: '100%', background: '#0b0e17', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: 'var(--text2)' }}>
                    Icon Theme Gradient
                  </label>
                  <select
                    value={formGradient}
                    onChange={(e) => setFormGradient(e.target.value)}
                    style={{ width: '100%', background: '#0b0e17', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px' }}
                  >
                    {GRADIENT_PRESETS.map((p) => (
                      <option key={p.name} value={p.value} style={{ background: '#111', color: '#fff' }}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: 'var(--text2)' }}>
                  App Description / Features
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Tell users why this app is special (e.g. No ads, unlimited HD video downloads, fast playback)..."
                  style={{ width: '100%', background: '#0b0e17', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploading}
                  style={{
                    background: 'var(--acc)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    cursor: saving || isUploading ? 'not-allowed' : 'pointer',
                    fontWeight: '800'
                  }}
                >
                  {saving ? 'Saving...' : editingApp ? 'Save Changes' : 'Publish to Downloads'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: BLOGGER EMBED CODE GENERATOR
          ======================================================== */}
      {isEmbedModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#141724',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#fff' }}>
                  📋 Blogger & Website Embed Code
                </h2>
                <p style={{ color: 'var(--text3)', fontSize: '13px', margin: '4px 0 0' }}>
                  Paste this directly into Blogger (HTML View) or any webpage. Hardened CSS ensures zero layout breakage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEmbedModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <textarea
              readOnly
              rows={16}
              value={generateBloggerEmbedHtml()}
              style={{
                width: '100%',
                background: '#090b12',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '14px',
                color: '#34d399',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.4',
                resize: 'vertical',
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#10b981' }}>
                ✓ Includes all {apps.filter(a => a.is_active !== false).length} active apps & FlixOn Free Movies Cinema Showcase
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEmbedModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generateBloggerEmbedHtml());
                    setEmbedCopied(true);
                    setTimeout(() => setEmbedCopied(false), 2500);
                  }}
                  style={{
                    background: embedCopied ? '#10b981' : 'var(--acc)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  {embedCopied ? '✓ Copied to Clipboard!' : '📋 Copy Entire HTML Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown Size';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

function cleanFileNameToTitle(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[\._-]/g, ' ')
    .replace(/\b(apk|mod|premium|v\d+.*)\b/ig, '')
    .trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
