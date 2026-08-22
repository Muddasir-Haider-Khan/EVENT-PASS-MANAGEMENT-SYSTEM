'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building, Plus, Trash2, CheckCircle2, AlertCircle, Users } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  country: string | null;
  institution: string | null;
  leader?: { id: string; name: string; email: string } | null;
  members?: Array<{ id: string; name: string; email: string; phone: string | null; photoUrl: string | null }>;
  _count: {
    members?: number;
    participants?: number;
    submissions: number;
  };
}

export default function ManagerGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [institution, setInstitution] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadGroups() {
    try {
      const res = await fetch('/api/manager/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/manager/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, country, institution }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Delegation / Group created successfully!' });
        setName('');
        setCountry('');
        setInstitution('');
        loadGroups();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create group' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network request error' });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this delegation group?')) return;
    try {
      const res = await fetch(`/api/manager/groups?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadGroups();
      }
    } catch {
      // Handled silently
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building className="w-6 h-6 text-indigo-400" />
          Delegations & Groups Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Organize delegates into institutions, university delegations, or country groups for MUN operations.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Create New Group */}
      <Card variant="glass" className="p-6 border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-400" />
          Create New Delegation / Group
        </h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Group / Delegation Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. LUMS Delegation"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-sm text-white rounded-xl px-4 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Institution / School
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. LUMS University"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-sm text-white rounded-xl px-4 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Assigned Country / Allocation
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United States of America"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-sm text-white rounded-xl px-4 py-2.5 outline-none"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={creating}
              className="w-full"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Save Group
            </Button>
          </div>
        </form>
      </Card>

      {/* Existing Groups */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Delegation Groups ({groups.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading delegations...</div>
        ) : groups.length === 0 ? (
          <Card variant="glass" className="p-8 text-center text-slate-400 text-xs border-slate-800">
            No delegation groups created yet. Add your first group above.
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id} variant="glass" className="p-5 border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      {group.institution && <span>🏫 {group.institution}</span>}
                      {group.country && <span>🇺🇳 Country: <strong className="text-white">{group.country}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 text-indigo-300">
                      {group._count.members ?? group._count.participants ?? 0} Delegates
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(group.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {(group.members && group.members.length > 0) && (
                  <div className="pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Group Members:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {group.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs"
                        >
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt={member.name} className="w-4 h-4 rounded-full object-cover" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          )}
                          <span className="text-white font-medium">{member.name || member.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
