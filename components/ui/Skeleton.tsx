import React from 'react';

export const Skeleton = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

export const StatCardSkeleton = () => {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 p-6 shadow-lg animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded w-24"></div>
        <div className="h-8 bg-gray-300 rounded w-20"></div>
        <div className="h-3 bg-gray-300 rounded w-32"></div>
      </div>
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
      <div className="space-y-3">
        <div className="flex items-end justify-between h-64">
          <div className="w-1/6 bg-gray-200 rounded" style={{ height: '60%' }}></div>
          <div className="w-1/6 bg-gray-200 rounded" style={{ height: '80%' }}></div>
          <div className="w-1/6 bg-gray-200 rounded" style={{ height: '70%' }}></div>
          <div className="w-1/6 bg-gray-200 rounded" style={{ height: '90%' }}></div>
          <div className="w-1/6 bg-gray-200 rounded" style={{ height: '75%' }}></div>
          <div className="w-1/6 bg-gray-200 rounded" style={{ height: '85%' }}></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-12"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[1, 2, 3, 4, 5].map((col) => (
                <th key={col} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, idx) => (
              <tr key={idx}>
                {[1, 2, 3, 4, 5].map((col) => (
                  <td key={col} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
};

export const VehicleCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <div className="w-20 h-20 bg-gray-200 rounded"></div>
          <div className="w-20 h-20 bg-gray-200 rounded"></div>
          <div className="w-20 h-20 bg-gray-200 rounded"></div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>

      <div className="flex gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};
