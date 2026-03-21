import React from 'react';
import { UserCheck, UserX } from 'lucide-react';
import { Registration } from '../../types';

interface RegistrationTableProps {
  registrations: Registration[];
  onMarkAttendance: (id: string, status: 'ATTENDED' | 'NO_SHOW') => void;
}

export const RegistrationTable: React.FC<RegistrationTableProps> = ({ registrations, onMarkAttendance }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendee</th>
            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Attendance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {registrations.map((reg) => (
            <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-slate-900">{reg.fullName}</div>
                {reg.user && <div className="text-[10px] text-emerald-600 font-bold uppercase">Member</div>}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                <div>{reg.email}</div>
                <div className="text-xs">{reg.phone}</div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  reg.status === 'ATTENDED' ? 'bg-green-50 text-green-600' :
                  reg.status === 'NO_SHOW' ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {reg.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => onMarkAttendance(reg.id, 'ATTENDED')}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Mark Present"
                  >
                    <UserCheck size={18} />
                  </button>
                  <button 
                    onClick={() => onMarkAttendance(reg.id, 'NO_SHOW')}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Mark Absent"
                  >
                    <UserX size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
