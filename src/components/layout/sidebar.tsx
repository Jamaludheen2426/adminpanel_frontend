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
  Languages,
  DollarSign,
  Mail,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface MenuItem {
  labelKey: string;
  href?: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(['nav.locations']);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  // Menu items with translation keys
  const menuItems: MenuItem[] = [
    {
      labelKey: 'nav.dashboard',
      href: '/admin',
      icon: <LayoutDashboard size={20} />,
    },
    {
      labelKey: 'nav.users',
      href: '/admin/users',
      icon: <Users size={20} />,
    },
    {
      labelKey: 'nav.access_control',
      icon: <Shield size={20} />,
      children: [
        { labelKey: 'nav.roles', href: '/admin/roles', icon: <Lock size={20} /> },
        {
          labelKey: 'nav.permissions',
          href: '/admin/permissions',
          icon: <Lock size={20} />,
        },
      ],
    },
    {
      labelKey: 'nav.locations',
      href: '/admin/locations',
      icon: <MapPin size={20} />,
    },
    {
      labelKey: 'nav.configuration',
      icon: <Settings size={20} />,
      children: [
        { labelKey: 'nav.settings', href: '/admin/settings', icon: <Settings size={20} /> },
        { labelKey: 'nav.languages', href: '/admin/languages', icon: <Languages size={20} /> },
        { labelKey: 'nav.currencies', href: '/admin/currencies', icon: <DollarSign size={20} /> },
        { labelKey: 'nav.translations', href: '/admin/settings/translations', icon: <Languages size={20} /> },
        {
          labelKey: 'nav.email_templates',
          href: '/admin/email-templates',
          icon: <Mail size={20} />,
        },
      ],
    },
  ];

  const toggleExpand = (labelKey: string) => {
    setExpanded((prev) =>
      prev.includes(labelKey)
        ? prev.filter((item) => item !== labelKey)
        : [...prev, labelKey]
    );
  };

  const isActive = (href?: string) => href && pathname === href;
  const hasActiveChild = (children?: MenuItem[]) =>
    children?.some((child) => pathname === child.href || pathname.startsWith(child.href || ''));

  const SidebarContent = () => (
    <div className="p-4 space-y-2">
      {menuItems.map((item) => (
        <div key={item.labelKey}>
          {item.children ? (
            <div>
              <button
                onClick={() => toggleExpand(item.labelKey)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition ${
                  expanded.includes(item.labelKey) || hasActiveChild(item.children)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {t(item.labelKey)}
                </span>
                <ChevronDown
                  size={18}
                  className={`transition ${
                    expanded.includes(item.labelKey) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expanded.includes(item.labelKey) && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.labelKey}
                      href={child.href || '#'}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                        isActive(child.href)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {child.icon}
                      {t(child.labelKey)}
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
              {t(item.labelKey)}
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
