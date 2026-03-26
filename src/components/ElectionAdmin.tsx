import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Vote, 
  Flag, 
  AlertTriangle, 
  BarChart3, 
  Users, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Plus,
  Search,
  ChevronRight,
  FileText,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Candidate, Constituency } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export function ElectionAdmin({ defaultTab = 'overview' }: { defaultTab?: 'overview' | 'candidates' | 'incidents' | 'results' | 'readiness' | 'constituencies' | 'cycles' }) {
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any[]>([]);
  const [pollingStations, setPollingStations] = useState<any[]>([]);
  const [booths, setBooths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'incidents' | 'results' | 'readiness' | 'constituencies' | 'cycles' | 'pollingStations'>(defaultTab as any);
  
  // Modal state
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isConstituencyModalOpen, setIsConstituencyModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isPollingStationModalOpen, setIsPollingStationModalOpen] = useState(false);
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'candidate' | 'cycle' | 'constituency' | 'incident' | 'result' | 'pollingStation' } | null>(null);
  
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editingCycle, setEditingCycle] = useState<any | null>(null);
  const [editingConstituency, setEditingConstituency] = useState<Constituency | null>(null);
  const [editingIncident, setEditingIncident] = useState<any | null>(null);
  const [editingResult, setEditingResult] = useState<any | null>(null);
  const [editingPollingStation, setEditingPollingStation] = useState<any | null>(null);
  const [editingBooth, setEditingBooth] = useState<any | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [candidateForm, setCandidateForm] = useState({
    name: '',
    position: '',
    constituencyId: '',
    manifesto: '',
    status: 'ACTIVE'
  });

  const [cycleForm, setCycleForm] = useState({
    name: '',
    year: new Date().getFullYear(),
    type: 'FEDERAL',
    startDate: '',
    endDate: '',
    status: 'UPCOMING'
  });

  const [constituencyForm, setConstituencyForm] = useState({
    name: '',
    code: '',
    type: 'FEDERAL',
    province: '',
    district: '',
    totalVoters: 0
  });

  const [incidentForm, setIncidentForm] = useState({
    type: 'OTHER',
    severity: 'LOW',
    description: '',
    status: 'REPORTED',
    pollingStationId: '',
    boothId: ''
  });

  const [resultForm, setResultForm] = useState({
    candidateId: '',
    constituencyId: '',
    votesReceived: 0,
    isWinner: false,
    verified: false
  });

  const [pollingStationForm, setPollingStationForm] = useState({
    name: '',
    code: '',
    location: '',
    constituencyId: '',
    ward: 1,
    localLevel: '',
    district: '',
    province: ''
  });

  const [readinessForm, setReadinessForm] = useState({
    status: 'NEEDS_ATTENTION',
    readinessNote: ''
  });

  useEffect(() => {
    fetchCycles();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      fetchCycleData();
    }
  }, [selectedCycle]);

  const fetchCycles = async () => {
    try {
      const [cyclesData, constData, stationsData, boothsData] = await Promise.all([
        api.get('/election/cycles'),
        api.get('/election/constituencies'),
        api.get('/election/polling-stations'),
        api.get('/booths')
      ]);
      setCycles(cyclesData);
      setConstituencies(constData);
      setPollingStations(stationsData);
      setBooths(boothsData);
      
      // Ensure a valid cycle is selected
      if (cyclesData.length > 0) {
        if (!selectedCycle || !cyclesData.find(c => c.id === selectedCycle.id)) {
          setSelectedCycle(cyclesData[0]);
        }
      } else {
        setSelectedCycle(null);
      }
    } catch (error) {
      console.error('Failed to fetch cycles', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCycleData = async () => {
    setLoading(true);
    try {
      const candData = await api.get(`/election/candidates?cycleId=${selectedCycle.id}`);
      const incData = await api.get(`/election/incidents?cycleId=${selectedCycle.id}`);
      const resData = await api.get(`/election/results?cycleId=${selectedCycle.id}`);
      const readData = await api.get('/election/booth-readiness');
      
      setCandidates(candData);
      setIncidents(incData);
      setResults(resData);
      setReadiness(readData);
    } catch (error) {
      console.error('Failed to fetch cycle data', error);
    } finally {
      setLoading(false);
    }
  };

  const openCandidateModal = (candidate?: Candidate) => {
    if (candidate) {
      setEditingCandidate(candidate);
      setCandidateForm({
        name: candidate.name,
        position: candidate.position,
        constituencyId: candidate.constituencyId || '',
        manifesto: candidate.manifesto || '',
        status: candidate.status
      });
    } else {
      setEditingCandidate(null);
      setCandidateForm({
        name: '',
        position: '',
        constituencyId: '',
        manifesto: '',
        status: 'ACTIVE'
      });
    }
    setIsCandidateModalOpen(true);
  };

  const openCycleModal = (cycle?: any) => {
    if (cycle) {
      setEditingCycle(cycle);
      setCycleForm({
        name: cycle.name,
        year: cycle.year,
        type: cycle.type,
        startDate: cycle.startDate ? new Date(cycle.startDate).toISOString().split('T')[0] : '',
        endDate: cycle.endDate ? new Date(cycle.endDate).toISOString().split('T')[0] : '',
        status: cycle.status
      });
    } else {
      setEditingCycle(null);
      setCycleForm({
        name: '',
        year: new Date().getFullYear(),
        type: 'FEDERAL',
        startDate: '',
        endDate: '',
        status: 'UPCOMING'
      });
    }
    setIsCycleModalOpen(true);
  };

  const openConstituencyModal = (constituency?: Constituency) => {
    if (constituency) {
      setEditingConstituency(constituency);
      setConstituencyForm({
        name: constituency.name,
        code: constituency.code || '',
        type: constituency.type,
        province: constituency.province,
        district: constituency.district,
        totalVoters: constituency.totalVoters || 0
      });
    } else {
      setEditingConstituency(null);
      setConstituencyForm({
        name: '',
        code: '',
        type: 'FEDERAL',
        province: '',
        district: '',
        totalVoters: 0
      });
    }
    setIsConstituencyModalOpen(true);
  };

  const openPollingStationModal = (station?: any) => {
    if (station) {
      setEditingPollingStation(station);
      setPollingStationForm({
        name: station.name,
        code: station.code || '',
        location: station.location || '',
        constituencyId: station.constituencyId || '',
        ward: station.ward || 1,
        localLevel: station.localLevel || '',
        district: station.district || '',
        province: station.province || ''
      });
    } else {
      setEditingPollingStation(null);
      setPollingStationForm({
        name: '',
        code: '',
        location: '',
        constituencyId: '',
        ward: 1,
        localLevel: '',
        district: '',
        province: ''
      });
    }
    setIsPollingStationModalOpen(true);
  };

  const openIncidentModal = (incident?: any) => {
    if (incident) {
      setEditingIncident(incident);
      setIncidentForm({
        type: incident.type,
        severity: incident.severity,
        description: incident.description,
        status: incident.status,
        pollingStationId: incident.pollingStationId || '',
        boothId: incident.boothId || ''
      });
    } else {
      setEditingIncident(null);
      setIncidentForm({
        type: 'OTHER',
        severity: 'LOW',
        description: '',
        status: 'REPORTED',
        pollingStationId: '',
        boothId: ''
      });
    }
    setIsIncidentModalOpen(true);
  };

  const openResultModal = (result?: any) => {
    if (result) {
      setEditingResult(result);
      setResultForm({
        candidateId: result.candidateId,
        constituencyId: result.constituencyId || '',
        votesReceived: result.votesReceived,
        isWinner: result.isWinner || false,
        verified: !!result.verifiedAt
      });
    } else {
      setEditingResult(null);
      setResultForm({
        candidateId: '',
        constituencyId: '',
        votesReceived: 0,
        isWinner: false,
        verified: false
      });
    }
    setIsResultModalOpen(true);
  };

  const openReadinessModal = (booth: any) => {
    setEditingBooth(booth);
    setReadinessForm({
      status: booth.status || 'NEEDS_ATTENTION',
      readinessNote: booth.readinessNote || ''
    });
    setIsReadinessModalOpen(true);
  };

  const handleCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCycle) {
        await api.put(`/election/cycles/${editingCycle.id}`, cycleForm);
      } else {
        await api.post('/election/cycles', cycleForm);
      }
      setIsCycleModalOpen(false);
      fetchCycles();
      setMessage({ type: 'success', text: `Cycle ${editingCycle ? 'updated' : 'created'} successfully` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save cycle' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConstituencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingConstituency) {
        await api.put(`/election/constituencies/${editingConstituency.id}`, constituencyForm);
      } else {
        await api.post('/election/constituencies', constituencyForm);
      }
      setIsConstituencyModalOpen(false);
      fetchCycles(); // Also fetches constituencies
      setMessage({ type: 'success', text: `Constituency ${editingConstituency ? 'updated' : 'created'} successfully` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save constituency' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePollingStationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPollingStation) {
        await api.put(`/election/polling-stations/${editingPollingStation.id}`, pollingStationForm);
      } else {
        await api.post('/election/polling-stations', pollingStationForm);
      }
      setIsPollingStationModalOpen(false);
      fetchCycles(); // Also fetches polling stations
      setMessage({ type: 'success', text: `Polling Station ${editingPollingStation ? 'updated' : 'created'} successfully` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save polling station' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...incidentForm, cycleId: selectedCycle.id };
      if (editingIncident) {
        await api.put(`/election/incidents/${editingIncident.id}`, payload);
      } else {
        await api.post('/election/incidents', payload);
      }
      setIsIncidentModalOpen(false);
      fetchCycleData();
      setMessage({ type: 'success', text: `Incident ${editingIncident ? 'updated' : 'reported'} successfully` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save incident' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...resultForm, cycleId: selectedCycle.id };
      if (editingResult) {
        await api.put(`/election/results/${editingResult.id}`, payload);
      } else {
        await api.post('/election/results', payload);
      }
      setIsResultModalOpen(false);
      fetchCycleData();
      setMessage({ type: 'success', text: `Result ${editingResult ? 'updated' : 'entered'} successfully` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save result' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReadinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/election/booths/${editingBooth.id}/readiness`, readinessForm);
      setIsReadinessModalOpen(false);
      fetchCycleData();
      setMessage({ type: 'success', text: 'Booth readiness updated successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update booth readiness' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        ...candidateForm,
        electionCycleId: selectedCycle.id,
        constituencyId: candidateForm.constituencyId || undefined
      };

      if (editingCandidate) {
        await api.put(`/election/candidates/${editingCandidate.id}`, payload);
        setMessage({ type: 'success', text: 'Candidate updated successfully' });
      } else {
        await api.post('/election/candidates', payload);
        setMessage({ type: 'success', text: 'Candidate added successfully' });
      }

      setIsCandidateModalOpen(false);
      fetchCycleData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save candidate' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenericDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const { id, type } = deleteTarget;
      let endpoint = '';
      switch (type) {
        case 'candidate': endpoint = `/election/candidates/${id}`; break;
        case 'cycle': endpoint = `/election/cycles/${id}`; break;
        case 'constituency': endpoint = `/election/constituencies/${id}`; break;
        case 'incident': endpoint = `/election/incidents/${id}`; break;
        case 'result': endpoint = `/election/results/${id}`; break;
        case 'pollingStation': endpoint = `/election/polling-stations/${id}`; break;
      }
      
      await api.delete(endpoint);
      setMessage({ type: 'success', text: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully` });
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      
      if (type === 'cycle' || type === 'constituency' || type === 'pollingStation') {
        fetchCycles();
      } else {
        fetchCycleData();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete item' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: string, type: 'candidate' | 'cycle' | 'constituency' | 'incident' | 'result' | 'pollingStation') => {
    setDeleteTarget({ id, type });
    setIsDeleteModalOpen(true);
  };

  if (loading && cycles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Election Operations</h1>
          <p className="text-slate-500">Manage cycles, candidates, and real-time polling data</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedCycle?.id} 
            onChange={(e) => setSelectedCycle(cycles.find(c => c.id === e.target.value))}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
            ))}
          </select>
          {activeTab !== 'overview' && activeTab !== 'readiness' && (
            <button 
              onClick={() => {
                if (activeTab === 'candidates') openCandidateModal();
                else if (activeTab === 'cycles') openCycleModal();
                else if (activeTab === 'constituencies') openConstituencyModal();
                else if (activeTab === 'incidents') openIncidentModal();
                else if (activeTab === 'results') openResultModal();
                else if (activeTab === 'pollingStations') openPollingStationModal();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold"
            >
              <Plus size={18} />
              {activeTab === 'candidates' ? 'Add Candidate' : 
               activeTab === 'cycles' ? 'New Cycle' :
               activeTab === 'constituencies' ? 'New Constituency' :
               activeTab === 'incidents' ? 'Report Incident' :
               activeTab === 'results' ? 'Enter Result' : 
               activeTab === 'pollingStations' ? 'Add Polling Station' : 'Add New'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Candidates</p>
              <p className="text-2xl font-bold text-slate-900">{candidates.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Incidents</p>
              <p className="text-2xl font-bold text-slate-900">{incidents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Booths Ready</p>
              <p className="text-2xl font-bold text-slate-900">
                {readiness.filter(r => r.status === 'READY').length} / {readiness.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Results Verified</p>
              <p className="text-2xl font-bold text-slate-900">
                {results.filter(r => r.verifiedAt).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'candidates', label: 'Candidates' },
          { id: 'constituencies', label: 'Constituencies' },
          { id: 'pollingStations', label: 'Polling Stations' },
          { id: 'cycles', label: 'Cycles' },
          { id: 'incidents', label: 'Incidents' },
          { id: 'results', label: 'Results' },
          { id: 'readiness', label: 'Booth Readiness' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="text-amber-500" size={20} />
                  Recent Incidents
                </h3>
                <div className="space-y-3">
                  {incidents.slice(0, 3).map(inc => (
                    <div key={inc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          inc.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                          inc.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="text-xs text-slate-500">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{inc.type}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{inc.description}</p>
                    </div>
                  ))}
                  {incidents.length === 0 && <p className="text-sm text-slate-500 italic">No incidents reported.</p>}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="text-emerald-500" size={20} />
                  Top Results
                </h3>
                <div className="space-y-3">
                  {results.slice(0, 5).map(res => (
                    <div key={res.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                          <Vote size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{res.candidate.name}</p>
                          <p className="text-xs text-slate-500">{res.constituency?.name || 'Global'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{res.votesReceived.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">Votes</p>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && <p className="text-sm text-slate-500 italic">No results entered yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'constituencies' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 font-bold text-slate-900">Name</th>
                    <th className="pb-3 font-bold text-slate-900">Code</th>
                    <th className="pb-3 font-bold text-slate-900">Type</th>
                    <th className="pb-3 font-bold text-slate-900">Province/District</th>
                    <th className="pb-3 font-bold text-slate-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {constituencies.map(con => (
                    <tr key={con.id} className="hover:bg-slate-50 transition-all">
                      <td className="py-4 font-medium text-slate-900">{con.name}</td>
                      <td className="py-4 text-slate-500">{con.code}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold">{con.type}</span>
                      </td>
                      <td className="py-4 text-slate-500">{con.province} / {con.district}</td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openConstituencyModal(con)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => confirmDelete(con.id, 'constituency')} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pollingStations' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 font-bold text-slate-900">Name</th>
                    <th className="pb-3 font-bold text-slate-900">Code</th>
                    <th className="pb-3 font-bold text-slate-900">Location</th>
                    <th className="pb-3 font-bold text-slate-900">Constituency</th>
                    <th className="pb-3 font-bold text-slate-900">Booths</th>
                    <th className="pb-3 font-bold text-slate-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pollingStations.map(station => (
                    <tr key={station.id} className="hover:bg-slate-50 transition-all">
                      <td className="py-4 font-medium text-slate-900">{station.name}</td>
                      <td className="py-4 text-slate-500">{station.code || 'N/A'}</td>
                      <td className="py-4 text-slate-500">{station.location}</td>
                      <td className="py-4 text-slate-500">{station.constituency?.name || 'N/A'}</td>
                      <td className="py-4 text-slate-500">{station._count?.booths || 0}</td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openPollingStationModal(station)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => confirmDelete(station.id, 'pollingStation')} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pollingStations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                        No polling stations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cycles' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 font-bold text-slate-900">Name</th>
                    <th className="pb-3 font-bold text-slate-900">Year</th>
                    <th className="pb-3 font-bold text-slate-900">Type</th>
                    <th className="pb-3 font-bold text-slate-900">Status</th>
                    <th className="pb-3 font-bold text-slate-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cycles.map(cyc => (
                    <tr key={cyc.id} className="hover:bg-slate-50 transition-all">
                      <td className="py-4 font-medium text-slate-900">{cyc.name}</td>
                      <td className="py-4 text-slate-500">{cyc.year}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md text-xs font-bold">{cyc.type}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          cyc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' :
                          cyc.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {cyc.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openCycleModal(cyc)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => confirmDelete(cyc.id, 'cycle')} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'candidates' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Constituency</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map(cand => (
                  <tr key={cand.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{cand.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{cand.position}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{cand.constituency?.name || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        cand.status === 'WON' ? 'bg-emerald-100 text-emerald-600' :
                        cand.status === 'ACTIVE' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {cand.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <FileText size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500">{cand.documents?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openCandidateModal(cand)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Candidate"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(cand.id, 'candidate')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Candidate"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                      No candidates found for this cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Incident Log</h3>
            </div>
            <div className="space-y-3">
              {incidents.map(inc => (
                <div key={inc.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        inc.severity === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                        inc.severity === 'HIGH' ? 'bg-orange-50 text-orange-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        <ShieldAlert size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{inc.type}</h4>
                        <p className="text-xs text-slate-500">
                          {inc.pollingStation?.name && <span>{inc.pollingStation.name}</span>}
                          {inc.booth?.name && <span> • {inc.booth.name}</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Reported by {inc.reporter?.displayName || 'Unknown'} • {new Date(inc.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-600' :
                        inc.status === 'INVESTIGATING' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {inc.status}
                      </span>
                      <button onClick={() => openIncidentModal(inc)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => confirmDelete(inc.id, 'incident')} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{inc.description}</p>
                </div>
              ))}
              {incidents.length === 0 && <p className="text-center py-12 text-slate-500">No incidents found.</p>}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Election Results</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(res => (
                <div key={res.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all relative overflow-hidden">
                  {res.isWinner && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 text-[10px] font-bold rounded-bl-lg">
                      WINNER
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                        <Vote size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{res.candidate.name}</h4>
                        <p className="text-xs text-slate-500">{res.constituency?.name || 'Global'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openResultModal(res)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => confirmDelete(res.id, 'result')} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{res.votesReceived.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Votes</p>
                    </div>
                    <div className="text-right">
                      {res.verifiedAt ? (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                          <CheckCircle2 size={12} />
                          VERIFIED
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">PENDING VERIFICATION</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {results.length === 0 && <p className="text-center py-12 text-slate-500">No results recorded yet.</p>}
          </div>
        )}

        {activeTab === 'readiness' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Booth Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Deployments</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Outreach</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Readiness</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readiness.map(booth => (
                  <tr key={booth.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{booth.name}</p>
                      {booth.readinessNote && <p className="text-[10px] text-slate-500 italic">{booth.readinessNote}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        booth.status === 'READY' ? 'bg-emerald-100 text-emerald-600' :
                        booth.status === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {booth.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{booth.teamCount}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{booth.deploymentCount}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{booth.outreachCount}</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            booth.readinessScore > 80 ? 'bg-emerald-500' :
                            booth.readinessScore > 50 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${booth.readinessScore}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 mt-1 block">{booth.readinessScore}% Ready</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openReadinessModal(booth)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Update Readiness"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Delete</h3>
                <p className="text-slate-500">Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone and will fail if there are linked records.</p>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-center gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-2 text-slate-600 font-bold hover:text-slate-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenericDelete}
                  disabled={isSubmitting}
                  className="px-8 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Polling Station Modal */}
      <AnimatePresence>
        {isPollingStationModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingPollingStation ? 'Edit Polling Station' : 'New Polling Station'}
                </h3>
                <button onClick={() => setIsPollingStationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handlePollingStationSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                    <input 
                      type="text"
                      required
                      value={pollingStationForm.name}
                      onChange={(e) => setPollingStationForm({ ...pollingStationForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Polling Station Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Code</label>
                    <input 
                      type="text"
                      value={pollingStationForm.code}
                      onChange={(e) => setPollingStationForm({ ...pollingStationForm, code: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., PS-001"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Location</label>
                    <input 
                      type="text"
                      required
                      value={pollingStationForm.location}
                      onChange={(e) => setPollingStationForm({ ...pollingStationForm, location: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Physical address or description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Constituency</label>
                    <select 
                      required
                      value={pollingStationForm.constituencyId}
                      onChange={(e) => setPollingStationForm({ ...pollingStationForm, constituencyId: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Constituency</option>
                      {constituencies.map(con => (
                        <option key={con.id} value={con.id}>{con.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Ward</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={pollingStationForm.ward}
                      onChange={(e) => setPollingStationForm({ ...pollingStationForm, ward: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Local Level</label>
                    <input 
                      type="text"
                      required
                      value={pollingStationForm.localLevel}
                      onChange={(e) => setPollingStationForm({ ...pollingStationForm, localLevel: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">District</label>
                    <input 
                      type="text"
                      required
                      value={pollingStationForm.district}
                      onChange={(e) => setPollingStationForm({ ...pollingStationForm, district: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Province</label>
                    <input 
                      type="text"
                      required
                      value={pollingStationForm.province}
                      onChange={(e) => setPollingStationForm({ ...pollingStationForm, province: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsPollingStationModalOpen(false)}
                    className="px-6 py-2 text-slate-600 font-bold hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Polling Station'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Candidate Modal */}
      <AnimatePresence>
        {isCandidateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingCandidate ? 'Edit Candidate' : 'New Candidate'}
                </h3>
                <button onClick={() => setIsCandidateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCandidateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={candidateForm.name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Candidate's full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Position</label>
                  <input 
                    type="text"
                    required
                    value={candidateForm.position}
                    onChange={(e) => setCandidateForm({ ...candidateForm, position: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Member of Parliament"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Constituency</label>
                  <select 
                    value={candidateForm.constituencyId}
                    onChange={(e) => setCandidateForm({ ...candidateForm, constituencyId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Constituency (Optional)</option>
                    {constituencies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={candidateForm.status}
                    onChange={(e) => setCandidateForm({ ...candidateForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="WITHDRAWN">WITHDRAWN</option>
                    <option value="DISQUALIFIED">DISQUALIFIED</option>
                    <option value="WON">WON</option>
                    <option value="LOST">LOST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Manifesto Summary</label>
                  <textarea 
                    value={candidateForm.manifesto}
                    onChange={(e) => setCandidateForm({ ...candidateForm, manifesto: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-32 resize-none"
                    placeholder="Brief summary of candidate's manifesto"
                  />
                </div>
              </form>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button onClick={() => setIsCandidateModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold">Cancel</button>
                <button onClick={handleCandidateSubmit} disabled={isSubmitting} className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : editingCandidate ? 'Update Candidate' : 'Save Candidate'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cycle Modal */}
      <AnimatePresence>
        {isCycleModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingCycle ? 'Edit Election Cycle' : 'New Election Cycle'}
                </h3>
                <button onClick={() => setIsCycleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCycleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Cycle Name</label>
                  <input 
                    type="text"
                    required
                    value={cycleForm.name}
                    onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Federal Elections 2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Year</label>
                    <input 
                      type="number"
                      required
                      value={cycleForm.year}
                      onChange={(e) => setCycleForm({ ...cycleForm, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                    <select 
                      value={cycleForm.type}
                      onChange={(e) => setCycleForm({ ...cycleForm, type: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="FEDERAL">FEDERAL</option>
                      <option value="PROVINCIAL">PROVINCIAL</option>
                      <option value="LOCAL">LOCAL</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
                    <input 
                      type="date"
                      required
                      value={cycleForm.startDate}
                      onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">End Date</label>
                    <input 
                      type="date"
                      required
                      value={cycleForm.endDate}
                      onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={cycleForm.status}
                    onChange={(e) => setCycleForm({ ...cycleForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </form>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button onClick={() => setIsCycleModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold">Cancel</button>
                <button onClick={handleCycleSubmit} disabled={isSubmitting} className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : editingCycle ? 'Update Cycle' : 'Save Cycle'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Constituency Modal */}
      <AnimatePresence>
        {isConstituencyModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingConstituency ? 'Edit Constituency' : 'New Constituency'}
                </h3>
                <button onClick={() => setIsConstituencyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleConstituencySubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Constituency Name</label>
                  <input 
                    type="text"
                    required
                    value={constituencyForm.name}
                    onChange={(e) => setConstituencyForm({ ...constituencyForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Code</label>
                    <input 
                      type="text"
                      required
                      value={constituencyForm.code}
                      onChange={(e) => setConstituencyForm({ ...constituencyForm, code: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                    <select 
                      value={constituencyForm.type}
                      onChange={(e) => setConstituencyForm({ ...constituencyForm, type: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="FEDERAL">FEDERAL</option>
                      <option value="PROVINCIAL">PROVINCIAL</option>
                      <option value="LOCAL">LOCAL</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Province</label>
                    <input 
                      type="text"
                      required
                      value={constituencyForm.province}
                      onChange={(e) => setConstituencyForm({ ...constituencyForm, province: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">District</label>
                    <input 
                      type="text"
                      required
                      value={constituencyForm.district}
                      onChange={(e) => setConstituencyForm({ ...constituencyForm, district: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Total Voters</label>
                  <input 
                    type="number"
                    value={constituencyForm.totalVoters}
                    onChange={(e) => setConstituencyForm({ ...constituencyForm, totalVoters: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </form>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button onClick={() => setIsConstituencyModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold">Cancel</button>
                <button onClick={handleConstituencySubmit} disabled={isSubmitting} className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : editingConstituency ? 'Update Constituency' : 'Save Constituency'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Incident Modal */}
      <AnimatePresence>
        {isIncidentModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingIncident ? 'Update Incident' : 'Report Incident'}
                </h3>
                <button onClick={() => setIsIncidentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleIncidentSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                    <select 
                      value={incidentForm.type}
                      onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="VIOLENCE">VIOLENCE</option>
                      <option value="FRAUD">FRAUD</option>
                      <option value="TECHNICAL">TECHNICAL</option>
                      <option value="LOGISTICAL">LOGISTICAL</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Severity</label>
                    <select 
                      value={incidentForm.severity}
                      onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Polling Station</label>
                    <select 
                      value={incidentForm.pollingStationId}
                      onChange={(e) => setIncidentForm({ ...incidentForm, pollingStationId: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">N/A</option>
                      {pollingStations.map(ps => (
                        <option key={ps.id} value={ps.id}>{ps.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Booth</label>
                    <select 
                      value={incidentForm.boothId}
                      onChange={(e) => setIncidentForm({ ...incidentForm, boothId: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">N/A</option>
                      {booths.filter(b => !incidentForm.pollingStationId || b.pollingStationId === incidentForm.pollingStationId).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={incidentForm.status}
                    onChange={(e) => setIncidentForm({ ...incidentForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="REPORTED">REPORTED</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                  <textarea 
                    required
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-32 resize-none"
                  />
                </div>
              </form>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button onClick={() => setIsIncidentModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold">Cancel</button>
                <button onClick={handleIncidentSubmit} disabled={isSubmitting} className="px-8 py-2 bg-red-600 text-white rounded-xl font-bold disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : editingIncident ? 'Update Incident' : 'Report Incident'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {isResultModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingResult ? 'Update Result' : 'Enter Result'}
                </h3>
                <button onClick={() => setIsResultModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleResultSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Candidate</label>
                  <select 
                    required
                    value={resultForm.candidateId}
                    onChange={(e) => setResultForm({ ...resultForm, candidateId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Candidate</option>
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.position})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Constituency</label>
                  <select 
                    value={resultForm.constituencyId}
                    onChange={(e) => setResultForm({ ...resultForm, constituencyId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Constituency (Optional)</option>
                    {constituencies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Votes Received</label>
                  <input 
                    type="number"
                    required
                    value={resultForm.votesReceived}
                    onChange={(e) => setResultForm({ ...resultForm, votesReceived: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={resultForm.isWinner}
                      onChange={(e) => setResultForm({ ...resultForm, isWinner: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-bold text-slate-700">Winner</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={resultForm.verified}
                      onChange={(e) => setResultForm({ ...resultForm, verified: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-bold text-slate-700">Verified</span>
                  </label>
                </div>
              </form>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button onClick={() => setIsResultModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold">Cancel</button>
                <button onClick={handleResultSubmit} disabled={isSubmitting} className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : editingResult ? 'Update Result' : 'Save Result'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Readiness Modal */}
      <AnimatePresence>
        {isReadinessModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  Update Booth Readiness: {editingBooth?.name}
                </h3>
                <button onClick={() => setIsReadinessModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleReadinessSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={readinessForm.status}
                    onChange={(e) => setReadinessForm({ ...readinessForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="READY">READY</option>
                    <option value="NEEDS_ATTENTION">NEEDS ATTENTION</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="NOT_STARTED">NOT STARTED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Readiness Note</label>
                  <textarea 
                    value={readinessForm.readinessNote}
                    onChange={(e) => setReadinessForm({ ...readinessForm, readinessNote: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-32 resize-none"
                    placeholder="Describe current readiness status, missing equipment, etc."
                  />
                </div>
              </form>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button onClick={() => setIsReadinessModalOpen(false)} className="px-6 py-2 text-slate-600 font-bold">Cancel</button>
                <button onClick={handleReadinessSubmit} disabled={isSubmitting} className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Update Readiness'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
