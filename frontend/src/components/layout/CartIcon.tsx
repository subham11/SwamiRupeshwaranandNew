'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/useAuth';

export default function CartIcon() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <Link
      href={`/${locale}/cart`}
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Cart"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-700 dark:text-gray-300"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold text-white px-1"
          style={{ backgroundColor: 'var(--color-gold, #F97316)' }}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );
}
