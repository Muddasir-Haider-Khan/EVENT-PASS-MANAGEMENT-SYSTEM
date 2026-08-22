'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { Users, Plus, Building, Mail, Phone } from 'lucide-react';


interface GroupItem {
  id: string;
  name: string;
  leaderName: string | null;
  leaderEmail: string | null;
  leaderPhone: string | null;
  institution: string | null;
  createdAt: string;
  participants: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
  }[];
  submissions: {
    id: string;
    email: string;
    status: string;
  }[];
}

export default function ManagerGroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    institution: '',
  });

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch {
      toast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/manager/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.error || 'Failed to create group', 'error');
        return;
      }

      toast('Delegation group created', 'success');
      setShowModal(false);
      setForm({ name: '', leaderName: '', leaderEmail: '', leaderPhone: '', institution: '' });
      loadGroups();
    } catch {
      toast('Network error creating group', 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>MUN Delegation Roster</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Group Delegations & Schools</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage institutional delegations, head delegates, and group pass allocations.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Group Delegation</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Building className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No Group Delegations Formed</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Delegation groups can be created manually or formed automatically when delegates register with group credentials.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Delegation</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((g) => (
            <div
              key={g.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{g.name}</h2>
                  {g.institution && (
                    <p className="text-xs text-indigo-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5" />
                      <span>{g.institution}</span>
                    </p>
                  )}
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full">
                  {g.participants.length} Delegates
                </span>
              </div>

              {/* Head Delegate Info */}
              {(g.leaderName || g.leaderEmail) && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Head Delegate / Faculty Leader</span>
                  {g.leaderName && <p className="text-slate-200 font-semibold">{g.leaderName}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    {g.leaderEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{g.leaderEmail}</span>}
                    {g.leaderPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{g.leaderPhone}</span>}
                  </div>
                </div>
              )}

              {/* Roster of members */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">Delegation Roster ({g.participants.length})</span>
                {g.participants.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No delegates assigned to this group yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {g.participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-slate-950/40 rounded-lg text-xs border border-slate-800/60">
                        <span className="font-medium text-slate-200">{p.name}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Verified Pass
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Delegation */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Group Delegation</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Delegation Name *</label>
                <input
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Aitchison College Delegation"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Institution / School / Society</label>
                <input
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Aitchison College Lahore"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Head Delegate Name</label>
                <input
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Muhammad Ali"
                  value={form.leaderName}
                  onChange={(e) => setForm({ ...form, leaderName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Leader Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="head@aitchison.edu.pk"
                    value={form.leaderEmail}
                    onChange={(e) => setForm({ ...form, leaderEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Leader Phone</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="+92 300 1234567"
                    value={form.leaderPhone}
                    onChange={(e) => setForm({ ...form, leaderPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Save Delegation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
