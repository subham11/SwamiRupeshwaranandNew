'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AppLocale } from '@/i18n/config';
import { useAuth } from '@/lib/useAuth';

// User icon
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Logout icon
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// Dashboard icon
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

interface AuthButtonProps {
  locale: AppLocale;
}

export default function AuthButton({ locale }: AuthButtonProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push(`/${locale}`);
  };

  const labels = {
    login: locale === 'en' ? 'Login' : 'लॉगिन',
    dashboard: locale === 'en' ? 'Dashboard' : 'डैशबोर्ड',
    logout: locale === 'en' ? 'Logout' : 'लॉगआउट',
    myAccount: locale === 'en' ? 'My Account' : 'मेरा खाता',
  };

  // Not authenticated - show login button
  if (!isAuthenticated) {
    return (
      <Link
        href={`/${locale}/login`}
        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:bg-gray-50"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <UserIcon />
        <span>{labels.login}</span>
      </Link>
    );
  }

  // Authenticated - show user menu
  return (
    <div className="relative hidden sm:block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:bg-gray-50"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="hidden md:inline max-w-[100px] truncate">
          {user?.name || user?.email?.split('@')[0] || labels.myAccount}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border bg-white py-1 z-50"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Link
            href={`/${locale}/dashboard`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
            style={{ color: 'var(--color-text)' }}
          >
            <DashboardIcon />
            {labels.dashboard}
          </Link>
          <hr className="my-1" style={{ borderColor: 'var(--color-border)' }} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
            style={{ color: 'var(--color-danger, #dc2626)' }}
          >
            <LogoutIcon />
            {labels.logout}
          </button>
        </div>
      )}
    </div>
  );
}
