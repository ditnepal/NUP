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
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 ${bg} ${color} rounded-xl group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`${trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider`}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">{value}</p>
  </div>
);
