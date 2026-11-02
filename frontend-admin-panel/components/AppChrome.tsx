'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import { clearSessionCookie, hasSessionCookie } from '../lib/session';

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const [allowed, setAllowed] = useState(isLogin);

  useEffect(() => {
    if (pathname === '/login') {
      setAllowed(true);
      return;
    }
    const signedIn = hasSessionCookie() && !!localStorage.getItem('vayosetu_admin_token');
    if (!signedIn) {
      localStorage.removeItem('vayosetu_admin_token');
      localStorage.removeItem('vayosetu_admin_user');
      clearSessionCookie();
      window.location.replace('/login');
      return;
    }
    setAllowed(true);
  }, [pathname]);

  if (isLogin) {
    return <main className="container">{children}</main>;
  }

  if (!allowed) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main className="container">{children}</main>
    </>
  );
}
