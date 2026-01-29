'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradientFrom: string;
  gradientTo: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  gradientFrom,
  gradientTo,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, translateY: -4 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} p-6 shadow-lg`}
    >
      <div className="absolute right-0 top-0 opacity-10">
        <Icon size={120} strokeWidth={1} />
      </div>

      <div className="relative z-10">
        <div className="mb-4 inline-flex rounded-lg bg-white/20 p-3 backdrop-blur-sm">
          <Icon size={24} className="text-white" />
        </div>

        <h3 className="text-sm font-medium text-white/80">{title}</h3>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>

        {trend && (
          <div className="mt-3 flex items-center">
            <span
              className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-100' : 'text-red-100'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="ml-2 text-xs text-white/60">vs last month</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
