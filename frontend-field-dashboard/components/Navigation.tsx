'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUser, logout } from '../lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import { OfflineDB } from '../lib/offline-db';
import { apiClient } from '../lib/api-client';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  FileCheck2, 
  FileText, 
  Wifi, 
  WifiOff, 
  LogOut,
  RefreshCw,
  Shield
} from 'lucide-react';

export default function Navigation() {
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [draftCount, setDraftCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  const checkDrafts = async () => {
    try {
      const drafts = await OfflineDB.getDraftCitizens();
      setDraftCount(drafts.length);
    } catch (e) {
      // Ignore if indexedDB not ready
    }
  };

  useEffect(() => {
    const currentUser = getUser();
    const fieldRoles = ['FIELD_WORKER', 'LEVEL_1_FIELD_WORKER'];
    if (!currentUser && pathname !== '/login') {
      router.push('/login');
    } else if (currentUser && pathname !== '/login' && !fieldRoles.includes(currentUser.role)) {
      logout();
    } else {
      setUser(currentUser);
      if (currentUser && pathname !== '/login') {
        apiClient.get('/auth/me').catch(() => {
          // A 401 clears the saved login and returns the user to the login page.
        });
      }
    }

    checkDrafts();

    const handleOnline = () => {
      setIsOnline(true);
      checkDrafts();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkDrafts();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const interval = setInterval(checkDrafts, 3000);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [pathname, router]);

  if (pathname === '/login') return null;
  if (!user) return null;

  return (
    <header className="app-header">
      <Link href="/" className="brand-badge">
        <div className="brand-logo-icon" style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
          <Shield size={28} color="#2dd4bf" strokeWidth={2.5} />
        </div>
        <div>
          <div className="brand-title">Aayu AI</div>
          <div className="brand-subtitle">
            <span>Field Kiosk (PWA)</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ color: '#2dd4bf', fontWeight: 600 }}>{user.name}</span>
          </div>
        </div>
      </Link>

      <nav className="nav-links">
        <Link 
          href="/" 
          className={`nav-link ${pathname === '/' ? 'active' : ''}`}
        >
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/register" 
          className={`nav-link ${pathname === '/register' ? 'active' : ''}`}
        >
          <UserPlus size={17} />
          <span>Register</span>
        </Link>
        <Link 
          href="/citizens" 
          className={`nav-link ${pathname === '/citizens' ? 'active' : ''}`}
        >
          <Users size={17} />
          <span>Citizens</span>
        </Link>
        <Link 
          href="/documents" 
          className={`nav-link ${pathname === '/documents' ? 'active' : ''}`}
        >
          <FileCheck2 size={17} />
          <span>Verify Docs</span>
        </Link>
        <Link 
          href="/applications" 
          className={`nav-link ${pathname === '/applications' ? 'active' : ''}`}
        >
          <FileText size={17} />
          <span>Applications</span>
        </Link>
        <Link 
          href="/offline-sync" 
          className={`nav-link ${pathname === '/offline-sync' ? 'active' : ''}`}
          style={{
            position: 'relative',
            background: isOnline ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${isOnline ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.4)'}`,
            borderRadius: 'var(--radius-sm)'
          }}
        >
          {isOnline ? (
            <>
              <Wifi size={16} color="#34d399" />
              <span style={{ color: '#34d399', fontWeight: 600 }}>Live Cloud</span>
            </>
          ) : (
            <>
              <WifiOff size={16} color="#fbbf24" />
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>Offline PWA</span>
            </>
          )}

          {draftCount > 0 && (
            <span 
              style={{
                marginLeft: '0.35rem',
                background: '#f59e0b',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.72rem',
                borderRadius: '10px',
                padding: '1px 6px',
                lineHeight: '1.2'
              }}
              title={`${draftCount} records queued in IndexedDB`}
            >
              {draftCount}
            </span>
          )}
        </Link>
        
        <button 
          onClick={logout} 
          className="btn btn-secondary" 
          style={{ 
            marginLeft: '0.8rem', 
            padding: '0.45rem 0.85rem', 
            fontSize: '0.88rem', 
            color: '#fb7185',
            borderColor: 'rgba(244, 63, 94, 0.25)' 
          }}
          title="Logout"
        >
          <LogOut size={16} />
          <span>Exit</span>
        </button>
      </nav>
    </header>
  );
}
