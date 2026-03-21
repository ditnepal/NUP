import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  trend?: { value: string; positive: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, bg, trend }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 ${bg} ${color} rounded-xl`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`${trend.positive ? 'text-green-600' : 'text-red-600'} text-xs font-bold flex items-center gap-1`}>
          {trend.value}
        </span>
      )}
    </div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
  </div>
);
