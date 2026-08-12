'use client';

import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    // Check if we are in an iframe (e.g. mobile app WebView)
    if (typeof window !== 'undefined' && window.self !== window.top) {
      setIsIframe(true);
      return;
    }
    
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || isIframe) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-gray-900 text-white rounded-lg shadow-2xl p-5 z-[9999] flex items-center justify-between border border-gray-700 transition-all duration-300">
      <div className="flex-1 mr-4">
        <h3 className="font-semibold text-lg text-red-500">Add FlixOn to Home Screen</h3>
        <p className="text-sm text-gray-300 mt-1">Install our progressive web app for a better and faster experience.</p>
        <button 
          onClick={handleInstallClick}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors w-full"
        >
          Install the progressive web app
        </button>
      </div>
      <button 
        onClick={handleClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full transition-colors"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
