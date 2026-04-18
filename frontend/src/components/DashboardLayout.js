'use client';

import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { Search, Bell, Plus } from 'lucide-react';

const CRUMBS = {
  '/':              ['Workspace', 'Dashboard'],
  '/customers':     ['Workspace', 'Customers'],
  '/batteries':     ['Workspace', 'Batteries'],
  '/claims':        ['Workspace', 'Claims'],
  '/claims/create': ['Workspace', 'Claims', 'New'],
  '/brands':        ['System', 'Brands & models'],
};

function Topbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const crumb    = CRUMBS[pathname] || ['Workspace'];

  return (
    <div className="topbar">
      <nav className="crumb" aria-label="Breadcrumb">
        {crumb.map((seg, i) => (
          <span key={i}>
            {i > 0 && <span style={{ margin: '0 8px', color: 'var(--muted-2)' }}>/</span>}
            {i === crumb.length - 1 ? <strong>{seg}</strong> : seg}
          </span>
        ))}
      </nav>

      <div className="topbar-search">
        <Search size={14} className="ts-icon" />
        <input placeholder="Search customers, batteries, serial…" />
        <span className="kbd">⌘ K</span>
      </div>

      <button className="icon-btn" title="Notifications">
        <Bell size={15} strokeWidth={1.75} />
      </button>
      <button className="icon-btn" title="File a claim" onClick={() => router.push('/claims/create')}>
        <Plus size={15} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        {children}
      </div>
    </div>
  );
}
