'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function PublicDownloadsClient({ apps = [], movies = [], initialAppKey = '' }) {
  const [selectedAppId, setSelectedAppId] = useState(() => {
    if (initialAppKey) {
      const match = apps.find(a => a.id.toLowerCase() === initialAppKey.toLowerCase());
      if (match) return match.id;
    }
    return apps[0]?.id || 'vidmate';
  });

  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const [downloadingAppName, setDownloadingAppName] = useState('');
  const [movieFilter, setMovieFilter] = useState('All');
  const cinemaRef = useRef(null);

  // Sync if initialAppKey changes
  useEffect(() => {
    if (initialAppKey) {
      const match = apps.find(a => a.id.toLowerCase() === initialAppKey.toLowerCase());
      if (match) setSelectedAppId(match.id);
    }
  }, [initialAppKey, apps]);

  const activeApp = apps.find(a => a.id === selectedAppId) || apps[0] || {
    id: 'app',
    name: 'FlixOn Downloader',
    version: 'v1.0',
    file_size: '22 MB',
    file_url: 'https://cdn.flixon.net/apps/Vidmate-v6.0345-NoAds.apk',
    gradient: 'linear-gradient(135deg, #f43f5e, #fb923c)',
    badge: 'FREE'
  };

  // Trigger download action & track analytics
  function handleDownload(appToDownload, e) {
    if (e) e.stopPropagation();
    const target = appToDownload || activeApp;
    setSelectedAppId(target.id);
    setDownloadingAppName(target.name);
    setDownloadTriggered(true);

    // Call background tracker to increment download count
    if (target?.id) {
      fetch('/api/admin/shared-apps/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: target.id })
      }).catch(() => {});
    }

    // Scroll smoothly to movies showcase after short delay
    setTimeout(() => {
      cinemaRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 1200);
  }

  // Filter movies
  const filteredMovies = movies.filter(m => {
    if (movieFilter === 'All') return true;
    if (movieFilter === 'VJ Junior') return (m.categories || []).some(c => c.toLowerCase().includes('junior'));
    if (movieFilter === 'VJ Emmy') return (m.categories || []).some(c => c.toLowerCase().includes('emmy'));
    if (movieFilter === 'VJ Ice P') return (m.categories || []).some(c => c.toLowerCase().includes('ice'));
    if (movieFilter === 'Series') return m.type === 'gsm_series' || (m.categories || []).some(c => c.toLowerCase().includes('series'));
    return true;
  });

  return (
    <div className="dl-portal-root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

        .dl-portal-root {
          min-height: 100vh;
          background: #080a11;
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 0 0 70px 0;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        /* Top Brand Navigation */
        .dl-portal-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 12, 20, 0.92);
          backdrop-filter: blur(14px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .dl-brand-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .dl-brand-logo {
          height: 36px;
          width: auto;
          object-fit: contain;
        }

        .dl-brand-badge {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #10b981;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          padding: 4px 10px;
          border-radius: 8px;
        }

        .dl-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
          background: rgba(229, 9, 20, 0.15);
          border: 1px solid rgba(229, 9, 20, 0.4);
          padding: 8px 16px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .dl-nav-btn:hover {
          background: #e50914;
          color: #ffffff;
          transform: translateY(-1px);
        }

        /* Container */
        .dl-container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 24px 16px;
        }

        /* Top Announcement Ticker */
        .dl-live-ticker {
          background: linear-gradient(90deg, rgba(244, 63, 94, 0.15), rgba(245, 158, 11, 0.15), rgba(16, 185, 129, 0.15));
          border: 1px solid rgba(244, 63, 94, 0.3);
          border-radius: 12px;
          padding: 10px 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 13px;
        }

        .dl-ticker-text {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f1f5f9;
        }

        .dl-ticker-pulse {
          width: 8px;
          height: 8px;
          background: #f43f5e;
          border-radius: 50%;
          animation: dlBeacon 1.2s infinite ease-in-out;
        }

        /* Header */
        .dl-main-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .dl-main-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2.1rem, 5.2vw, 3.4rem);
          font-weight: 900;
          letter-spacing: -0.02em;
          margin: 0 0 8px 0;
          line-height: 1.1;
          background: linear-gradient(135deg, #ffffff 15%, #6ee7b7 55%, #38bdf8 95%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dl-sub-title {
          font-size: 14.5px;
          color: #94a3b8;
          margin: 0;
        }

        /* Top Spotlight / Hero Bar */
        .dl-spotlight-bar {
          background: linear-gradient(145deg, #121829 0%, #0c101c 100%);
          border: 2px solid rgba(16, 185, 129, 0.6);
          border-radius: 22px;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.75), 0 0 35px -10px rgba(16, 185, 129, 0.35);
          margin-bottom: 30px;
        }

        @media (min-width: 760px) {
          .dl-spotlight-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .dl-spotlight-left {
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 0;
          flex: 1;
        }

        .dl-spotlight-logo-wrap {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55);
        }

        .dl-spotlight-img {
          width: 52px;
          height: 52px;
          object-fit: contain;
          border-radius: 12px;
        }

        .dl-spotlight-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(1.4rem, 3.2vw, 1.85rem);
          font-weight: 900;
          margin: 0 0 6px 0;
          color: #ffffff;
          line-height: 1.15;
          word-break: break-word;
        }

        .dl-meta-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .dl-meta-pill {
          font-size: 11.5px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
        }

        .dl-meta-pill.verified {
          background: rgba(16, 185, 129, 0.16);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }

        .dl-meta-pill.b2 {
          background: rgba(56, 189, 248, 0.16);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.35);
        }

        .dl-spotlight-cta-box {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }

        .dl-pointer-cue {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(52, 211, 153, 0.55);
          color: #6ee7b7;
          font-family: 'Outfit', sans-serif;
          font-size: 12.5px;
          font-weight: 800;
          padding: 9px 13px;
          border-radius: 999px;
          animation: dlPointRight 0.9s infinite ease-in-out;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
        }

        .dl-spotlight-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 28px;
          border-radius: 14px;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none;
          color: #03150e;
          background: linear-gradient(135deg, #10b981 0%, #34d399 48%, #06b6d4 100%);
          box-shadow: 0 14px 32px -4px rgba(16, 185, 129, 0.65);
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
          cursor: pointer;
          border: none;
          white-space: nowrap;
        }

        .dl-spotlight-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 18px 40px -2px rgba(16, 185, 129, 0.85);
          filter: brightness(1.08);
          color: #03150e;
        }

        /* 1-Click Multi-App Grid */
        .dl-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .dl-section-head h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 20px;
          font-weight: 900;
          margin: 0;
          color: #ffffff;
        }

        .dl-apps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          margin-bottom: 34px;
        }

        .dl-app-card {
          background: rgba(18, 22, 34, 0.95);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: all 0.25s ease;
          position: relative;
          cursor: pointer;
        }

        .dl-app-card:hover {
          transform: translateY(-4px);
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 14px 34px -8px rgba(0, 0, 0, 0.6), 0 0 24px -10px rgba(16, 185, 129, 0.35);
        }

        .dl-app-card.is-active {
          border-color: #10b981;
          background: linear-gradient(160deg, rgba(16, 185, 129, 0.15), rgba(18, 22, 34, 0.98));
          box-shadow: 0 14px 34px -8px rgba(16, 185, 129, 0.35);
        }

        .dl-card-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .dl-card-logo-wrap {
          width: 54px;
          height: 54px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.4);
        }

        .dl-card-logo-img {
          width: 44px;
          height: 44px;
          object-fit: contain;
          border-radius: 10px;
        }

        .dl-card-info {
          flex: 1;
          min-width: 0;
        }

        .dl-card-name {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 4px 0;
          word-break: break-word;
        }

        .dl-card-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          background: rgba(244, 63, 94, 0.15);
          color: #fb7185;
          border: 1px solid rgba(244, 63, 94, 0.4);
          padding: 2px 6px;
          border-radius: 6px;
        }

        .dl-card-desc {
          font-size: 12.5px;
          color: #94a3b8;
          line-height: 1.45;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dl-card-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .dl-card-size {
          font-size: 12px;
          font-weight: 700;
          color: #38bdf8;
        }

        .dl-card-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 14px;
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 12.5px;
          font-weight: 800;
          text-transform: uppercase;
          text-decoration: none;
          color: #03150e;
          background: linear-gradient(135deg, #10b981, #34d399);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        .dl-card-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        /* Banner shown when download is triggered */
        .dl-download-alert {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.2));
          border: 1.5px solid #10b981;
          border-radius: 16px;
          padding: 18px 22px;
          margin-bottom: 34px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          animation: dlFadeIn 0.3s ease-out;
        }

        /* Cinema Showcase Section */
        .dl-cinema-wrap {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 36px;
          margin-top: 10px;
        }

        .dl-cinema-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }

        .dl-cinema-title-box h2 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(1.4rem, 3.2vw, 2.1rem);
          font-weight: 900;
          margin: 0 0 6px 0;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dl-cinema-title-box p {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }

        /* VJ Filter Tabs */
        .dl-vj-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .dl-vj-tab {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dl-vj-tab.is-active {
          background: #f43f5e;
          border-color: #f43f5e;
          color: #ffffff;
          box-shadow: 0 6px 18px rgba(244, 63, 94, 0.45);
        }

        .dl-cinema-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .dl-movie-card {
          position: relative;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(165deg, #170c18 0%, #0e101c 60%, #090b12 100%);
          border: 1.5px solid rgba(244, 63, 94, 0.45);
          box-shadow: 0 18px 42px -12px rgba(244, 63, 94, 0.34);
          text-decoration: none;
          color: #ffffff;
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.28s ease, box-shadow 0.28s ease;
        }

        .dl-movie-card:hover {
          transform: translateY(-6px);
          border-color: #fb7185;
          box-shadow: 0 24px 52px -8px rgba(244, 63, 94, 0.6), 0 0 28px -6px rgba(245, 158, 11, 0.35);
          color: #ffffff;
        }

        .dl-movie-visual {
          position: relative;
          height: 185px;
          width: 100%;
          overflow: hidden;
          background: #181a24;
        }

        .dl-movie-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.45s ease;
        }

        .dl-movie-card:hover .dl-movie-img {
          transform: scale(1.08);
        }

        .dl-movie-visual::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, #0e101c 10%, rgba(14, 16, 28, 0.2) 60%, rgba(0,0,0,0.4) 100%);
          pointer-events: none;
        }

        .dl-movie-top-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dl-badge-free {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(90deg, #f43f5e, #e11d48);
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          font-size: 10.5px;
          font-weight: 900;
          letter-spacing: 0.07em;
          padding: 5px 10px;
          border-radius: 999px;
          text-transform: uppercase;
          box-shadow: 0 6px 16px rgba(244, 63, 94, 0.65);
        }

        .dl-badge-hd {
          background: rgba(9, 10, 15, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(251, 191, 36, 0.55);
          color: #fcd34d;
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          font-weight: 800;
          padding: 5px 9px;
          border-radius: 8px;
        }

        .dl-play-button-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.55);
          transition: all 0.25s ease;
        }

        .dl-movie-card:hover .dl-play-button-center {
          transform: translate(-50%, -50%) scale(1.15);
          background: #f43f5e;
          border-color: #ffffff;
        }

        .dl-movie-body {
          padding: 16px 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .dl-movie-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 900;
          line-height: 1.2;
          margin: 0;
          color: #ffffff;
          background: linear-gradient(135deg, #ffffff 15%, #fda4af 65%, #fcd34d 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dl-movie-desc {
          font-size: 13px;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dl-movie-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .dl-vj-tag {
          font-size: 10.5px;
          font-weight: 700;
          color: #fde68a;
          background: rgba(245, 158, 11, 0.16);
          border: 1px solid rgba(245, 158, 11, 0.34);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .dl-stream-btn {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #ffffff;
          background: linear-gradient(135deg, #f43f5e 0%, #e11d48 52%, #f59e0b 100%);
          box-shadow: 0 10px 24px -5px rgba(244, 63, 94, 0.65);
          transition: filter 0.2s ease;
        }

        .dl-movie-card:hover .dl-stream-btn {
          filter: brightness(1.1);
        }

        /* VIP Bottom Promotion */
        .dl-vip-banner {
          margin-top: 48px;
          background: radial-gradient(circle at 10% 20%, rgba(229, 9, 20, 0.25), transparent 45%), linear-gradient(145deg, #160e1a 0%, #0d0e17 100%);
          border: 1.5px solid rgba(244, 63, 94, 0.35);
          border-radius: 22px;
          padding: 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
        }

        .dl-vip-text h3 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(1.4rem, 3vw, 1.85rem);
          font-weight: 900;
          margin: 0 0 6px 0;
          color: #ffffff;
        }

        .dl-vip-text p {
          font-size: 14px;
          color: #cbd5e1;
          margin: 0;
        }

        .dl-vip-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #e50914, #ff3b30);
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 900;
          padding: 15px 28px;
          border-radius: 14px;
          text-decoration: none;
          box-shadow: 0 10px 28px rgba(229, 9, 20, 0.5);
          white-space: nowrap;
        }

        @keyframes dlPointRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }

        @keyframes dlBeacon {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }

        @keyframes dlFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Independent Minimal Top Navigation */}
      <nav className="dl-portal-nav">
        <Link href="/" className="dl-brand-link">
          <img src="/logo.png" alt="FlixOn" className="dl-brand-logo" />
          <span className="dl-brand-badge">APP VAULT &amp; STORAGE</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" className="dl-nav-btn">
            <span>🎬</span>
            <span>FlixOn Movie Cinema ↗</span>
          </Link>
        </div>
      </nav>

      <div className="dl-container">
        {/* Live Cinema Ticker */}
        <div className="dl-live-ticker">
          <div className="dl-ticker-text">
            <span className="dl-ticker-pulse" />
            <strong>FREE CINEMA ALERT:</strong>
            <span>Stream 100% free Luganda translated movies (VJ Junior, VJ Emmy, VJ Ice P) with zero sign-up!</span>
          </div>
          <Link href="/?category=Free" style={{ color: '#f59e0b', fontWeight: '800', textDecoration: 'none' }}>
            Watch Free Movies ▶
          </Link>
        </div>

        {/* Header */}
        <header className="dl-main-header">
          <h1 className="dl-main-title">Downloaders Premium</h1>
          <p className="dl-sub-title">
            100% Virus-Free Verified APKs • High-Speed Direct CDN Storage • Instant Free Luganda Translated Movies
          </p>
        </header>

        {/* ========================================================
            SPOTLIGHT HERO BAR
            ======================================================== */}
        <section aria-label="Spotlight Featured App">
          <div className="dl-spotlight-bar">
            <div className="dl-spotlight-left">
              <div
                className="dl-spotlight-logo-wrap"
                style={{ background: activeApp.gradient || 'linear-gradient(135deg, #10b981, #06b6d4)' }}
              >
                {activeApp.local_icon || activeApp.icon_url ? (
                  <img
                    src={activeApp.local_icon || activeApp.icon_url}
                    alt={activeApp.name}
                    className="dl-spotlight-img"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
                    <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <h2 className="dl-spotlight-title">{activeApp.name}</h2>
                <div className="dl-meta-pills">
                  <span className="dl-meta-pill">{activeApp.version || 'v1.0'}</span>
                  <span className="dl-meta-pill">{activeApp.file_size || 'Direct APK'}</span>
                  <span className="dl-meta-pill verified">✓ Verified Safe</span>
                  {activeApp.badge && (
                    <span className="dl-meta-pill" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
                      {activeApp.badge}
                    </span>
                  )}
                  {activeApp.file_url?.includes('cdn.flixon.net') && (
                    <span className="dl-meta-pill b2">⚡ Fast B2 CDN</span>
                  )}
                </div>
              </div>
            </div>

            <div className="dl-spotlight-cta-box">
              <span className="dl-pointer-cue" aria-hidden="true">
                <span>Tap here</span>
                <span style={{ fontSize: '16px' }}>👉</span>
              </span>

              <a
                href={activeApp.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={(e) => handleDownload(activeApp, e)}
                className="dl-spotlight-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>DOWNLOAD {activeApp.file_size ? `(${activeApp.file_size})` : 'NOW'}</span>
              </a>
            </div>
          </div>

          {/* Download Started Alert Banner */}
          {downloadTriggered && (
            <div className="dl-download-alert">
              <div>
                <div style={{ fontWeight: '900', color: '#10b981', fontSize: '16px', marginBottom: '2px' }}>
                  🎉 Your download for {downloadingAppName || 'the app'} has started!
                </div>
                <div style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                  While your APK downloads, stream today&apos;s hottest Luganda translated movies below 100% free!
                </div>
              </div>
              <button
                type="button"
                onClick={() => cinemaRef.current?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: '#10b981',
                  color: '#000',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: '900',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Watch Free Movies Below 👇
              </button>
            </div>
          )}
        </section>

        {/* ========================================================
            ALL APKS: EVERY FILE HAS ITS OWN 1-CLICK DOWNLOAD BUTTON
            ======================================================== */}
        <section aria-label="Choose APK File to Download">
          <div className="dl-section-head">
            <h2>📦 Choose a File to Download (1-Click Instant)</h2>
            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>
              ✓ All Hosted on Backblaze B2 CDN
            </span>
          </div>

          <div className="dl-apps-grid">
            {apps.map((app) => {
              const isSelected = app.id === selectedAppId;
              const logoSrc = app.local_icon || app.icon_url;

              return (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedAppId(app.id);
                  }}
                  className={`dl-app-card ${isSelected ? 'is-active' : ''}`}
                >
                  <div className="dl-card-top">
                    <div
                      className="dl-card-logo-wrap"
                      style={{ background: app.gradient || 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                    >
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt={app.name}
                          className="dl-card-logo-img"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
                          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                        </svg>
                      )}
                    </div>

                    <div className="dl-card-info">
                      <div className="dl-card-name">{app.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700' }}>
                          {app.version || 'APK'}
                        </span>
                        {app.badge && <span className="dl-card-badge">{app.badge}</span>}
                      </div>
                    </div>
                  </div>

                  <p className="dl-card-desc">
                    {app.description || 'High-speed Android application. Free from ads, clean, verified virus-free, and fast.'}
                  </p>

                  <div className="dl-card-footer">
                    <span className="dl-card-size">
                      {app.file_size || 'Direct APK'}
                    </span>

                    <a
                      href={app.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      onClick={(e) => handleDownload(app, e)}
                      className="dl-card-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>DOWNLOAD</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================
            CINEMA AD SHOWCASE: "WATCH FREE MOVIES ALL VJs"
            ======================================================== */}
        <section ref={cinemaRef} className="dl-cinema-wrap" aria-label="Watch Free Movies All VJs Showcase">
          <div className="dl-cinema-header">
            <div className="dl-cinema-title-box">
              <h2>
                <span>🎬</span>
                <span>Watch Free Movies • All VJs</span>
              </h2>
              <p>Stream trending action, series &amp; blockbusters dubbed in Luganda by top VJs—100% free with 0 sign-up.</p>
            </div>

            <Link
              href="/?category=Free"
              style={{
                fontSize: '13px',
                fontWeight: '800',
                color: '#f43f5e',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '8px 16px',
                borderRadius: '10px',
                textDecoration: 'none'
              }}
            >
              View All Free Movies ↗
            </Link>
          </div>

          {/* VJ Filter Pills */}
          <div className="dl-vj-tabs">
            {['All', 'VJ Junior', 'VJ Emmy', 'VJ Ice P', 'Series'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMovieFilter(tab)}
                className={`dl-vj-tab ${movieFilter === tab ? 'is-active' : ''}`}
              >
                {tab === 'All' ? '🔥 All Free Cinema' : tab}
              </button>
            ))}
          </div>

          <div className="dl-cinema-grid">
            {filteredMovies.map((movie) => {
              const vjs = (movie.categories || []).filter(c => c.toLowerCase().includes('vj'));
              const genres = (movie.categories || []).filter(c => !c.toLowerCase().includes('vj')).slice(0, 2);
              const poster = movie.thumbnail_url || 'https://thefilmstage.com/wp-content/uploads/2017/02/Shoot-Em-Up.jpg';

              return (
                <Link
                  key={movie.id}
                  href={`/movie/${movie.id}`}
                  className="dl-movie-card"
                  title={`Watch ${movie.title} free on FlixOn`}
                >
                  <div className="dl-movie-visual">
                    <img
                      src={poster}
                      alt={movie.title}
                      className="dl-movie-img"
                      loading="lazy"
                    />

                    <div className="dl-movie-top-badges">
                      <span className="dl-badge-free">
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'dlBeacon 1.3s infinite ease-in-out' }} />
                        FREE • ALL VJs
                      </span>
                      <span className="dl-badge-hd">HD 1080p</span>
                    </div>

                    <div className="dl-play-button-center" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="6 3 20 12 6 21 6 3" />
                      </svg>
                    </div>
                  </div>

                  <div className="dl-movie-body">
                    <h3 className="dl-movie-title">{movie.title}</h3>
                    <p className="dl-movie-desc">
                      {movie.description || 'Watch full-length translated cinema with crystal-clear audio and fast mobile playback on FlixOn.'}
                    </p>

                    <div className="dl-movie-pills">
                      {vjs.length > 0 ? (
                        vjs.map(v => <span key={v} className="dl-vj-tag">{v}</span>)
                      ) : (
                        <span className="dl-vj-tag">VJ Junior</span>
                      )}
                      {genres.map(g => (
                        <span key={g} style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', padding: '3px 8px', borderRadius: '6px' }}>
                          {g}
                        </span>
                      ))}
                    </div>

                    <div className="dl-stream-btn">
                      <span>WATCH FREE NOW</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* VIP Promotion Banner */}
          <div className="dl-vip-banner">
            <div className="dl-vip-text">
              <h3>🎬 Want 1,000+ Translated Movies on FlixOn?</h3>
              <p>
                Watch exclusive releases from VJ Junior, VJ Emmy, VJ Ice P, VJ Jingo, VJ Mark &amp; download movies to watch offline on any phone, tablet, or TV.
              </p>
            </div>

            <Link href="/" className="dl-vip-btn">
              <span>EXPLORE FULL FLIXON CINEMA ▶</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
