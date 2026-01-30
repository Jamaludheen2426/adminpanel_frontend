'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  Users,
  Shield,
  Lock,
  MapPin,
  Settings,
  LogIn,
  Menu,
  X,
} from 'lucide-react';

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <Users size={20} />,
  },
  {
    label: 'Access Control',
    icon: <Shield size={20} />,
    children: [
      { label: 'Roles', href: '/admin/roles', icon: <Lock size={20} /> },
      {
        label: 'Permissions',
        href: '/admin/permissions',
        icon: <Lock size={20} />,
      },
    ],
  },
  {
    label: 'Locations',
    href: '/admin/locations',
    icon: <MapPin size={20} />,
  },
  {
    label: 'Configuration',
    icon: <Settings size={20} />,
    children: [
      { label: 'Settings', href: '/admin/settings', icon: <Settings size={20} /> },
      { label: 'Languages', href: '/admin/languages', icon: <LogIn size={20} /> },
      { label: 'Currencies', href: '/admin/currencies', icon: <LogIn size={20} /> },
      {
        label: 'Email Templates',
        href: '/admin/email-templates',
        icon: <LogIn size={20} />,
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(['Locations']);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleExpand = (label: string) => {
    setExpanded((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href?: string) => href && pathname === href;
  const hasActiveChild = (children?: MenuItem[]) =>
    children?.some((child) => pathname === child.href || pathname.startsWith(child.href || ''));

  const SidebarContent = () => (
    <div className="p-4 space-y-2">
      {menuItems.map((item) => (
        <div key={item.label}>
          {item.children ? (
            <div>
              <button
                onClick={() => toggleExpand(item.label)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition ${
                  expanded.includes(item.label) || hasActiveChild(item.children)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
                <ChevronDown
                  size={18}
                  className={`transition ${
                    expanded.includes(item.label) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expanded.includes(item.label) && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href || '#'}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive(child.href)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {child.icon}
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              href={item.href || '#'}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg z-40"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-gray-200 flex-col max-h-screen sticky top-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 w-64 h-screen bg-white shadow-lg overflow-y-auto">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
