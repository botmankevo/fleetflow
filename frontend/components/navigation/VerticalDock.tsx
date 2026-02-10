'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  DollarSign,
  Settings,
  FileText,
  BarChart3,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    color: 'text-blue-500',
  },
  {
    title: 'Loads',
    href: '/admin/loads',
    icon: Package,
    color: 'text-green-500',
  },
  {
    title: 'Drivers',
    href: '/admin/drivers',
    icon: Users,
    color: 'text-purple-500',
  },
  {
    title: 'Equipment',
    href: '/admin/equipment',
    icon: Truck,
    color: 'text-orange-500',
  },
  {
    title: 'Dispatch',
    href: '/admin/dispatch',
    icon: FileText,
    color: 'text-indigo-500',
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    color: 'text-pink-500',
  },
  {
    title: 'Payroll',
    href: '/admin/payroll',
    icon: DollarSign,
    color: 'text-emerald-500',
  },
  {
    title: 'Customers',
    href: '/admin/customers',
    icon: Users,
    color: 'text-blue-400',
  },
  {
    title: 'Vendors',
    href: '/admin/vendors',
    icon: FileText,
    color: 'text-indigo-400',
  },
  {
    title: 'Expenses',
    href: '/admin/expenses',
    icon: DollarSign,
    color: 'text-red-400',
  },
  {
    title: 'IFTA',
    href: '/admin/ifta',
    icon: FileText,
    color: 'text-yellow-400',
  },
  {
    title: 'Safety',
    href: '/admin/safety',
    icon: FileText,
    color: 'text-orange-400',
  },
  {
    title: 'Tolls',
    href: '/admin/tolls',
    icon: DollarSign,
    color: 'text-purple-400',
  },
  {
    title: 'Docs Exchange',
    href: '/admin/docs-exchange',
    icon: FileText,
    color: 'text-cyan-500',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    color: 'text-gray-500',
  },
];

export function VerticalDock() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ width: 80 }}
      animate={{ width: isExpanded ? 240 : 80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-gray-200 dark:bg-gray-900/80 dark:border-gray-800 z-50 flex flex-col shadow-lg"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
        <motion.div
          className="flex items-center gap-3 px-4"
          animate={{ opacity: isExpanded ? 1 : 0.8 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            F
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap"
              >
                MAIN TMS
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.05, x: 4 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all cursor-pointer group',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  )}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <div className={cn('relative', isActive ? item.color : '')}>
                    <Icon className="w-6 h-6" />
                    {/* Active Dot */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
                      />
                    )}
                  </div>

                  {/* Label */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'text-sm font-medium whitespace-nowrap',
                          isActive ? 'text-primary' : ''
                        )}
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Hover Tooltip (when collapsed) */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.title}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Expand/Collapse Toggle */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all"
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="w-5 h-5" />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-medium"
              >
                Collapse
              </motion.span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
