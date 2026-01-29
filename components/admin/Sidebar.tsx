'use client';

import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FileCheck, Settings, LogOut, X, UserCheck, Car, Clock, Tag, FileText, Layers, Package, Shield, UserCog, Star, Award, ClipboardList } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Permission, User } from '@/lib/types';
import { ConfirmLogoutModal } from '@/components/ui/ConfirmLogoutModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

interface NavItem {
  name: string;
  icon: any;
  href: string;
  requiredPermissions?: { resource: string; action: string }[];
}

export default function Sidebar({ isOpen, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const user = await apiClient.getProfile();
        setCurrentUser(user);

        // Fetch user permissions
        const permissions = await apiClient.getMyPermissions();
        setUserPermissions(permissions);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const allNavItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    {
      name: 'Users',
      icon: Users,
      href: '/dashboard/users',
      requiredPermissions: [{ resource: 'users', action: 'read' }]
    },
    {
      name: 'Drivers',
      icon: UserCheck,
      href: '/dashboard/drivers',
      requiredPermissions: [{ resource: 'drivers', action: 'read' }]
    },
    {
      name: 'Vehicles KYC',
      icon: Car,
      href: '/dashboard/vehicles',
      requiredPermissions: [{ resource: 'vehicles', action: 'read' }]
    },
    {
      name: 'Vehicle Categories',
      icon: Layers,
      href: '/dashboard/vehicle-categories',
      requiredPermissions: [{ resource: 'vehicle_categories', action: 'read' }]
    },
    {
      name: 'Config Vehicle',
      icon: Package,
      href: '/dashboard/vehicle-types',
      requiredPermissions: [{ resource: 'vehicle_types', action: 'read' }]
    },
    {
      name: 'Brand Types',
      icon: Award,
      href: '/dashboard/brand-types',
      requiredPermissions: [{ resource: 'brand_types', action: 'read' }]
    },
    {
      name: 'Bookings',
      icon: FileCheck,
      href: '/dashboard/bookings',
      requiredPermissions: [{ resource: 'bookings', action: 'read' }]
    },
    {
      name: 'Reviews',
      icon: Star,
      href: '/dashboard/reviews',
      requiredPermissions: [{ resource: 'reviews', action: 'read' }]
    },
    {
      name: 'Coupons',
      icon: Tag,
      href: '/dashboard/coupons',
      requiredPermissions: [{ resource: 'coupons', action: 'read' }]
    },
    {
      name: 'Blogs',
      icon: FileText,
      href: '/dashboard/blogs',
      requiredPermissions: [{ resource: 'blogs', action: 'read' }]
    },
    {
      name: 'Pending KYC',
      icon: Clock,
      href: '/dashboard/kyc?filter=pending',
      requiredPermissions: [{ resource: 'kyc', action: 'read' }]
    },
    {
      name: 'Owner KYC',
      icon: ClipboardList,
      href: '/dashboard/owner-kyc',
      requiredPermissions: [{ resource: 'owner_kyc', action: 'read' }]
    },
    {
      name: 'Permissions',
      icon: Shield,
      href: '/dashboard/permissions',
      requiredPermissions: [{ resource: 'permissions', action: 'read' }]
    },
    {
      name: 'Sub-Admins',
      icon: UserCog,
      href: '/dashboard/sub-admins',
      requiredPermissions: [{ resource: 'sub_admins', action: 'read' }]
    },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  const hasPermission = (requiredPermissions?: { resource: string; action: string }[]): boolean => {
    // If no permissions required, always show
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // If user is super admin (not sub-admin), show all
    if (currentUser && !currentUser.is_sub_admin) {
      return true;
    }

    // Check if user has any of the required permissions
    return requiredPermissions.some(required =>
      userPermissions.some(
        perm => perm.resource === required.resource && perm.action === required.action
      )
    );
  };

  const navItems = allNavItems.filter(item => hasPermission(item.requiredPermissions));

  const handleNavigation = (href: string, item: NavItem) => {
    // Prevent navigation to Dashboard for sub-admins
    if (currentUser?.is_sub_admin && href === '/dashboard') {
      return;
    }
    router.push(href);
    onClose();
  };

  const isItemDisabled = (item: NavItem): boolean => {
    // Dashboard is disabled for sub-admins
    return currentUser?.is_sub_admin === true && item.href === '/dashboard';
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
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 text-white shadow-2xl z-50 transition-transform duration-300 lg:translate-x-0 lg:static ${
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-white/50 text-sm">Loading...</div>
              </div>
            ) : (
              navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href.includes('?') && pathname === item.href.split('?')[0]);
                const disabled = isItemDisabled(item);

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href, item)}
                    disabled={disabled}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      disabled
                        ? 'opacity-40 blur-[1px] cursor-not-allowed'
                        : isActive
                        ? 'bg-white/20 text-white shadow-lg cursor-pointer'
                        : 'text-white/70 hover:bg-white/10 hover:text-white cursor-pointer'
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
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <ConfirmLogoutModal
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
      />
    </>
  );
}
