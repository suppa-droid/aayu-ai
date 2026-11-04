'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUser, logout } from '../lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  ScrollText, 
  Cpu, 
  TrendingUp, 
  LogOut, 
  Shield,
  Columns
} from 'lucide-react';

export default function Navigation() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    const adminRoles = ['DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'LEVEL_2_DISTRICT_ADMIN', 'LEVEL_3_SYSTEM_ADMIN'];
    if (!currentUser && pathname !== '/login') {
      router.push('/login');
    } else if (currentUser && pathname !== '/login' && !adminRoles.includes(currentUser.role)) {
      logout();
    } else {
      setUser(currentUser);
    }
  }, [pathname, router]);

  if (pathname === '/login') return null;
  if (!user) return null;

  return (
    <header className="app-header">
      <Link href="/dashboard" className="brand-badge">
        <div className="brand-logo-icon">
          <span>🛡️</span>
        </div>
        <div>
          <div className="brand-title">Aayu AI Admin</div>
          <div className="brand-subtitle">
            <span className="brand-name">{user.name}</span>
            <span aria-hidden="true">•</span>
            <span>
              {user.role
                ?.replaceAll('_', ' ')
                .toLowerCase()
                .replace(/\b\w/g, (letter: string) => letter.toUpperCase())}
            </span>
          </div>
        </div>
      </Link>

      <nav className="nav-links">
        <Link 
          href="/dashboard" 
          className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/applications" 
          className={`nav-link ${pathname === '/applications' ? 'active' : ''}`}
        >
          <Columns size={17} />
          <span>Tracking Pipeline</span>
        </Link>
        <Link 
          href="/escalations" 
          className={`nav-link ${pathname === '/escalations' ? 'active' : ''}`}
        >
          <ShieldAlert size={17} />
          <span>Escalations</span>
        </Link>
        <Link 
          href="/analytics" 
          className={`nav-link ${pathname === '/analytics' ? 'active' : ''}`}
        >
          <TrendingUp size={17} />
          <span>Analytics</span>
        </Link>
        <Link 
          href="/scheme-rules" 
          className={`nav-link ${pathname === '/scheme-rules' ? 'active' : ''}`}
        >
          <ScrollText size={17} />
          <span>Rules Matrix</span>
        </Link>
        <Link 
          href="/pipeline-health" 
          className={`nav-link ${pathname === '/pipeline-health' ? 'active' : ''}`}
        >
          <Cpu size={17} />
          <span>AI Pipeline</span>
        </Link>
        <Link 
          href="/users" 
          className={`nav-link ${pathname === '/users' ? 'active' : ''}`}
        >
          <Shield size={17} />
          <span>Users</span>
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
