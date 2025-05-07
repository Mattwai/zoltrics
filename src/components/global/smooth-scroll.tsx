'use client';

import { smoothScrollTo } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SmoothScrollLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SmoothScrollLink({ href, children, className }: SmoothScrollLinkProps) {
  const pathname = usePathname();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      const elementId = href.replace('#', '');
      smoothScrollTo(elementId);
    }
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
} 