'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { OfflineDB } from '../lib/offline-db';

export default function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ VayoSetu ServiceWorker registered with scope:', registration.scope);
          })
          .catch((err) => {
            console.warn('ServiceWorker registration error:', err);
          });
      });
    }

    // 2. Handle PWA Install Prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 3. Listen for online reconnect to trigger background auto-sync
    const handleOnline = () => {
      console.log('🌐 Connection restored. Checking IndexedDB sync queue...');
      OfflineDB.syncAllDrafts().then((result) => {
        if (result.syncedCount > 0) {
          console.log(`✅ Auto-synced ${result.syncedCount} offline beneficiary records!`);
        }
      });
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User PWA response: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <aside 
      aria-label="PWA Installation Prompt"
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
        background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.95) 0%, rgba(2, 132, 199, 0.95) 100%)',
        backdropFilter: 'blur(8px)',
        borderRadius: 'var(--radius-md)',
        padding: '0.9rem 1.25rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid rgba(45, 212, 191, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.9rem',
        maxWidth: '380px',
        animation: 'slideUp 0.3s ease'
      }}
    >
      <div style={{ color: '#fff' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Install VayoSetu App</h4>
        <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: '0.15rem 0 0 0' }}>
          Enable 100% offline access in zero-connectivity villages
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button 
          onClick={handleInstallClick}
          className="btn"
          style={{
            background: '#ffffff',
            color: '#0f766e',
            fontWeight: 700,
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            border: 'none',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Download size={14} style={{ marginRight: '4px' }} />
          Install
        </button>
        <button 
          onClick={() => setShowInstallBanner(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}
