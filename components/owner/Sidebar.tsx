'use client';

import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Car, Users, FileCheck, Settings, LogOut, X, UserCog, User as UserIcon } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import type { User } from '@/lib/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user?: User | null;
  isUserLoading?: boolean;
}

interface NavItem {
  name: string;
  icon: any;
  href: string;
  allowedRoles?: string[]; // Roles that can see this menu item
}

export default function Sidebar({ isOpen, onClose, onLogout, user, isUserLoading = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isSubUser =
    typeof user?.is_owner_sub_user === 'boolean' ? user.is_owner_sub_user : false;
  const userRole = user?.owner_sub_role || 'owner';
  const shouldShowSkeleton = isUserLoading || !user;

  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/owner/dashboard' },
    {
      name: 'Vehicles',
      icon: Car,
      href: '/owner/vehicles',
      allowedRoles: ['owner', 'admin', 'manager'] // Sales can't manage vehicles
    },
    {
      name: 'Drivers',
      icon: Users,
      href: '/owner/drivers',
      allowedRoles: ['owner', 'admin', 'manager'] // Sales can't manage drivers
    },
    {
      name: 'Manage Users',
      icon: UserCog,
      href: '/owner/manage-users',
      allowedRoles: ['owner', 'admin'] // Only owner and admin can manage sub-users
    },
    { name: 'Bookings', icon: FileCheck, href: '/owner/bookings' }, // All roles can see bookings
    { name: 'My Profile', icon: UserIcon, href: '/owner/profile' }, // All roles can see their profile
    { name: 'Settings', icon: Settings, href: '/owner/settings' },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    // If no role restrictions, show to everyone
    if (!item.allowedRoles) return true;

    // If user is not a sub-user (is main owner), show everything
    if (!isSubUser) return true;

    // While user info is loading, hide restricted links to avoid flicker
    if (shouldShowSkeleton || !userRole) return false;

    // If user is sub-user, check if their role is in allowed roles
    return item.allowedRoles.includes(userRole);
  });

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-purple-900 via-purple-800 to-blue-900 text-white shadow-2xl z-50 transition-transform duration-300 lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-white">
                <Logo />
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {shouldShowSkeleton ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, idx) => (
                  <div
                    key={`sidebar-skeleton-${idx}`}
                    className="h-11 rounded-lg bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </button>
                );
              })
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
