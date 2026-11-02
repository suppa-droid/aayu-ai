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
            <span aria-hidden="true">•</span>
            <span className="brand-person">{user.name}</span>
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
          className={`nav-link ${isOnline ? 'is-live' : 'is-offline'} ${pathname === '/offline-sync' ? 'active' : ''}`}
        >
          {isOnline ? (
            <>
              <Wifi size={16} color="#6ee7b7" />
              <span>Live Cloud</span>
            </>
          ) : (
            <>
              <WifiOff size={16} color="#fde68a" />
              <span>Offline PWA</span>
            </>
          )}

          {draftCount > 0 && (
            <span
              className="nav-draft-count"
              title={`${draftCount} records queued in IndexedDB`}
            >
              {draftCount}
            </span>
          )}
        </Link>

        <button
          onClick={logout}
          className="btn btn-secondary btn-exit"
          title="Logout"
        >
          <LogOut size={16} />
          <span>Exit</span>
        </button>
      </nav>
    </header>
  );
}
