'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

const routeMap: Record<string, string> = {
  dashboard: 'Overview',
  clients: 'Clients',
  reports: 'Reports',
  analytics: 'Analytics',
  customize: 'Customize',
  settings: 'Settings',
  billing: 'Billing',
  new: 'New',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  
  const breadcrumbs = React.useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];
    
    let currentPath = '';
    
    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      
      // Handle UUIDs or IDs in the path
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part) || 
                   (part.length > 20 && !isNaN(Number(part.charAt(0))));
      
      let label = routeMap[part] || part;
      
      if (isId) {
        label = index === 1 ? 'Details' : part; // e.g., /clients/[id] -> Clients / Details
      }
      
      crumbs.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: currentPath,
        active: index === parts.length - 1,
      });
    });
    
    return crumbs;
  }, [pathname]);

  if (pathname === '/dashboard') return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium">
      <ol className="flex items-center gap-1.5 list-none m-0 p-0 text-slate-500">
        <li className="flex items-center">
          <Link 
            href="/dashboard" 
            className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Home size={14} />
          </Link>
        </li>
        
        {breadcrumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight size={14} className="text-slate-300 shrink-0" />
            {crumb.active ? (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-900 font-bold border border-slate-200/50">
                {crumb.label}
              </span>
            ) : (
              <Link 
                href={crumb.href}
                className="px-1.5 py-0.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
