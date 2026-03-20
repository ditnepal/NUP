import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { OrganizationUnit } from '../types';
import { Plus, ChevronRight, ChevronDown, MapPin, Building2, Users } from 'lucide-react';

export const HierarchyAdmin: React.FC = () => {
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      const data = await api.get('/hierarchy');
      setUnits(data);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderUnit = (unit: any, depth = 0) => {
    const isExpanded = expanded[unit.id];
    const hasChildren = unit.children && unit.children.length > 0;

    return (
      <div key={unit.id} className="ml-4">
        <div 
          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-100"
          onClick={() => hasChildren && toggleExpand(unit.id)}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={16} className="text-gray-400 mr-2" /> : <ChevronRight size={16} className="text-gray-400 mr-2" />
          ) : (
            <div className="w-6" />
          )}
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-medium text-gray-900">{unit.name}</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full font-semibold">
                {unit.level}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1"><Building2 size={12} /> Offices: {unit.offices?.length || 0}</span>
              <span className="flex items-center gap-1"><Users size={12} /> Users: {unit.users?.length || 0}</span>
            </div>
          </div>
          <button className="p-1 text-gray-400 hover:text-blue-600">
            <Plus size={18} />
          </button>
        </div>
        {isExpanded && hasChildren && (
          <div className="border-l-2 border-gray-100 ml-2">
            {unit.children.map((child: any) => renderUnit(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading hierarchy...</div>;

  const rootUnits = units.filter(u => !u.parentId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Hierarchy</h1>
          <p className="text-gray-500">Manage your party's structural units and geographic scope.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Add Root Unit
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Unit Name & Level</span>
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</span>
        </div>
        <div className="p-2">
          {rootUnits.map(unit => renderUnit(unit))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
            <Building2 size={24} />
          </div>
          <h3 className="font-bold text-gray-900">Office Registry</h3>
          <p className="text-sm text-gray-500 mt-2">Manage physical office locations, contact details, and geo-coordinates.</p>
          <button className="mt-4 text-blue-600 font-semibold text-sm hover:underline">View Offices →</button>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-4">
            <MapPin size={24} />
          </div>
          <h3 className="font-bold text-gray-900">Geo-Mapping</h3>
          <p className="text-sm text-gray-500 mt-2">Visualize organizational density and booth strength on an interactive map.</p>
          <button className="mt-4 text-green-600 font-semibold text-sm hover:underline">Open Map →</button>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-gray-900">Bearers & Wings</h3>
          <p className="text-sm text-gray-500 mt-2">Assign office bearers to committees and manage specialized party wings.</p>
          <button className="mt-4 text-purple-600 font-semibold text-sm hover:underline">Manage Bearers →</button>
        </div>
      </div>
    </div>
  );
};
