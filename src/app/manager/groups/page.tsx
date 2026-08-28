'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Building,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  UserPlus,
  ArrowRightLeft,
  X,
  Edit2,
  Star,
  Layers,
  Search,
} from 'lucide-react';

interface ParticipantType {
  id: string;
  name: string;
  description?: string | null;
  isGroup?: boolean;
  groupSize?: number | null;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  participantTypeId: string | null;
  entryStatus: string;
  participantType?: { id: string; name: string } | null;
}

interface Group {
  id: string;
  name: string;
  leaderId: string | null;
  participantTypeId: string | null;
  participantType?: { id: string; name: string } | null;
  members: Member[];
  _count?: {
    members?: number;
  };
}

export default function ManagerGroupsPage() {
  const [categories, setCategories] = useState<ParticipantType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [singleParticipants, setSingleParticipants] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [addingMemberToGroupId, setAddingMemberToGroupId] = useState<string | null>(null);
  const [movingMember, setMovingMember] = useState<Member | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [selectedSingleMemberIds, setSelectedSingleMemberIds] = useState<string[]>([]);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editLeaderId, setEditLeaderId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  async function loadData() {
    try {
      const res = await fetch('/api/manager/groups');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setGroups(data.groups || []);
        setSingleParticipants(data.singleParticipants || []);
      }
    } catch (err) {
      console.error('Failed loading group data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle Create New Group
  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/manager/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName,
          participantTypeId: createCategory || null,
          memberIds: selectedSingleMemberIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Group "${createName}" created! Email notifications sent to assigned members.`,
        });
        setIsCreateModalOpen(false);
        setCreateName('');
        setCreateCategory('');
        setSelectedSingleMemberIds([]);
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create group' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network request failed' });
    } finally {
      setActionLoading(false);
    }
  }

  // Open Edit Group Modal
  function openEditModal(group: Group) {
    setEditingGroup(group);
    setEditName(group.name);
    setEditLeaderId(group.leaderId);
    setEditCategory(group.participantTypeId || '');
  }

  // Save Edit Group Info
  async function handleSaveEditGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGroup || !editName.trim()) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/manager/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_group_info',
          groupId: editingGroup.id,
          name: editName,
          leaderId: editLeaderId,
          participantTypeId: editCategory || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Group "${editName}" updated successfully!` });
        setEditingGroup(null);
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update group' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while updating group' });
    } finally {
      setActionLoading(false);
    }
  }

  // Remove Member from Group (Make Single)
  async function handleRemoveMember(removeMemberId: string, groupName: string) {
    if (!confirm('Are you sure you want to remove this member from the group? They will become a single participant and receive an email update.')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/manager/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_member',
          removeMemberId,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Member removed from ${groupName} and notified via email.` });
        if (editingGroup) {
          setEditingGroup({
            ...editingGroup,
            members: editingGroup.members.filter((m) => m.id !== removeMemberId),
          });
        }
        loadData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove member' });
    } finally {
      setActionLoading(false);
    }
  }

  // Add Selected Single Members to an existing Group
  async function handleAddMembersToGroup(targetGroupId: string, memberIdsToAdd: string[]) {
    if (memberIdsToAdd.length === 0) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/manager/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_members',
          groupId: targetGroupId,
          addMemberIds: memberIdsToAdd,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Added ${memberIdsToAdd.length} member(s) to group. Email notifications sent!` });
        setAddingMemberToGroupId(null);
        setSelectedSingleMemberIds([]);
        loadData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add members' });
    } finally {
      setActionLoading(false);
    }
  }

  // Move Member to Another Group or Single
  async function handleMoveMember(participantId: string, targetGroupId: string | null) {
    setActionLoading(true);
    try {
      const res = await fetch('/api/manager/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move_member',
          participantId,
          targetGroupId,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Member moved successfully! Email notification dispatched.' });
        setMovingMember(null);
        loadData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to move member' });
    } finally {
      setActionLoading(false);
    }
  }

  // Delete Group
  async function handleDeleteGroup(id: string, groupName: string) {
    if (!confirm(`Are you sure you want to delete group "${groupName}"? Members will be converted to single delegates and notified.`)) return;

    try {
      const res = await fetch(`/api/manager/groups?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Group "${groupName}" deleted. Members converted to single delegates.` });
        loadData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed deleting group' });
    }
  }

  // Filter logic
  const filteredSingleParticipants = singleParticipants.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategoryFilter === 'all' || p.participantTypeId === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      !searchQuery ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.members.some(
        (m) => (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) || m.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCat =
      selectedCategoryFilter === 'all' || g.participantTypeId === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Group Categories display builder
  const categorySections = [
    ...categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      isGroup: cat.isGroup,
      groupSize: cat.groupSize,
      groups: filteredGroups.filter((g) => g.participantTypeId === cat.id),
      singles: filteredSingleParticipants.filter((s) => s.participantTypeId === cat.id),
    })),
    {
      id: 'unassigned_cat',
      name: 'General / Unassigned Category',
      isGroup: false,
      groupSize: null,
      groups: filteredGroups.filter((g) => !g.participantTypeId),
      singles: filteredSingleParticipants.filter((s) => !s.participantTypeId),
    },
  ].filter((sec) => sec.groups.length > 0 || sec.singles.length > 0 || selectedCategoryFilter === sec.id);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building className="w-6 h-6 text-indigo-400" />
            Delegations & Groups Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize delegates into categories and groups with edit controls and automatic transactional email alerts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setSelectedSingleMemberIds([]);
            setIsCreateModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-lg shadow-indigo-500/20"
        >
          Create New Delegation / Group
        </Button>
      </div>

      {/* System Status / Notification Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-md ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <Card variant="glass" className="p-4 border-slate-800 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search groups, delegates, emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-white rounded-xl pl-9 pr-4 py-2.5 outline-none"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-white rounded-xl px-3 py-2.5 outline-none"
          >
            <option value="all">All Participant Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          <div>Loading categories and delegation groups...</div>
        </div>
      ) : categorySections.length === 0 ? (
        <Card variant="glass" className="p-12 text-center text-slate-400 text-xs border-slate-800">
          No categories or delegates found. Create participants or new delegation groups above.
        </Card>
      ) : (
        /* CATEGORIES LIST */
        <div className="space-y-8">
          {categorySections.map((sec) => (
            <div key={sec.id} className="space-y-4">
              {/* Category Header Banner */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-base font-bold text-white uppercase tracking-wider">{sec.name}</h2>
                  <span className="text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                    {sec.groups.length} Groups • {sec.singles.length} Single Members
                  </span>
                </div>
              </div>

              {/* SECTION GROUPS */}
              {sec.groups.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    👥 Delegation Groups ({sec.groups.length})
                  </span>
                  <div className="grid grid-cols-1 gap-4">
                    {sec.groups.map((group) => (
                      <Card key={group.id} variant="glass" className="p-5 border-slate-800 space-y-4 hover:border-indigo-500/30 transition-colors">
                        {/* Group Header Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-indigo-400" />
                              <h3 className="font-bold text-lg text-white">{group.name}</h3>
                              {group.participantType && (
                                <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                                  {group.participantType.name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions on Group */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAddingMemberToGroupId(group.id);
                                setSelectedSingleMemberIds([]);
                              }}
                              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                              className="text-xs"
                            >
                              + Add Member
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditModal(group)}
                              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                              className="text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGroup(group.id, group.name)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Group Members List */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            <span>Group Members ({group.members.length}):</span>
                            {group.leaderId && (
                              <span className="text-amber-400 flex items-center gap-1 text-[10px]">
                                <Star className="w-3 h-3 fill-amber-400" /> Leader Assigned
                              </span>
                            )}
                          </div>

                          {group.members.length === 0 ? (
                            <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                              No members currently in this group. Click "+ Add Member" to assign delegates.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {group.members.map((member) => {
                                const isLeader = member.id === group.leaderId;
                                return (
                                  <div
                                    key={member.id}
                                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                      isLeader
                                        ? 'bg-amber-500/10 border-amber-500/30'
                                        : 'bg-slate-950/80 border-slate-800/80'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      {member.photoUrl ? (
                                        <img src={member.photoUrl} alt={member.name || ''} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
                                          {(member.name || member.email)[0].toUpperCase()}
                                        </div>
                                      )}
                                      <div className="truncate">
                                        <div className="text-xs font-bold text-white flex items-center gap-1 truncate">
                                          <span className="truncate">{member.name || 'Delegate'}</span>
                                          {isLeader && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate">{member.email}</div>
                                      </div>
                                    </div>

                                    {/* Member Action Controls */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        title="Move member to another group"
                                        onClick={() => setMovingMember(member)}
                                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400"
                                      >
                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        title="Remove from group"
                                        onClick={() => handleRemoveMember(member.id, group.name)}
                                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION SINGLE MEMBERS */}
              {sec.singles.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    👤 Single / Individual Members in {sec.name} ({sec.singles.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {sec.singles.map((member) => (
                      <Card key={member.id} variant="glass" className="p-3 border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt={member.name || ''} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
                              {(member.name || member.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div className="truncate">
                            <div className="text-xs font-bold text-white truncate">{member.name || 'Delegate'}</div>
                            <div className="text-[10px] text-slate-400 truncate">{member.email}</div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMovingMember(member)}
                          className="text-[11px] px-2.5 py-1"
                        >
                          + Assign Group
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE NEW GROUP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card variant="glass" className="max-w-xl w-full p-6 border-slate-800 space-y-5 bg-slate-950/95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Create New Delegation / Group
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Group / Delegation Name *
                  </label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    placeholder="e.g. LUMS Delegation"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white rounded-xl px-3.5 py-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Category (Participant Type)
                  </label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white rounded-xl px-3.5 py-2.5 outline-none"
                  >
                    <option value="">-- General / No Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Single Members to Add Immediately */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold uppercase text-slate-300">
                  Select Single Members to Include ({selectedSingleMemberIds.length} selected):
                </label>

                {singleParticipants.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No single unassigned members available right now.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    {singleParticipants
                      .filter((p) => !createCategory || p.participantTypeId === createCategory)
                      .map((member) => {
                        const isSelected = selectedSingleMemberIds.includes(member.id);
                        return (
                          <label
                            key={member.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-500/20 border-indigo-500/40 text-white'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSingleMemberIds([...selectedSingleMemberIds, member.id]);
                                  } else {
                                    setSelectedSingleMemberIds(selectedSingleMemberIds.filter((id) => id !== member.id));
                                  }
                                }}
                                className="rounded text-indigo-500 bg-slate-900 border-slate-700"
                              />
                              <span className="font-medium truncate">{member.name || member.email}</span>
                              <span className="text-[10px] text-slate-400">({member.email})</span>
                            </div>
                            {member.participantType && (
                              <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                                {member.participantType.name}
                              </span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={actionLoading}>
                  Create & Notify Members →
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* EDIT GROUP MODAL */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card variant="glass" className="max-w-xl w-full p-6 border-slate-800 space-y-5 bg-slate-950/95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                Edit Group: {editingGroup.name}
              </h3>
              <button onClick={() => setEditingGroup(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Group / Delegation Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white rounded-xl px-3.5 py-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Category (Participant Type)
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white rounded-xl px-3.5 py-2.5 outline-none"
                >
                  <option value="">-- General / No Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Members Leadership & Removal List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold uppercase text-slate-300">
                  Group Members & Leader Selection:
                </label>

                {editingGroup.members.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No members currently in this group.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    {editingGroup.members.map((member) => {
                      const isLeader = member.id === editLeaderId;
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title={isLeader ? 'Leader' : 'Make Leader'}
                              onClick={() => setEditLeaderId(isLeader ? null : member.id)}
                              className={`p-1 rounded ${
                                isLeader ? 'text-amber-400 fill-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-amber-400'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${isLeader ? 'fill-amber-400' : ''}`} />
                            </button>
                            <span className="font-semibold text-white">{member.name || member.email}</span>
                            <span className="text-[10px] text-slate-400">({member.email})</span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id, editingGroup.name)}
                            className="text-red-400 text-xs h-7 px-2"
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setEditingGroup(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={actionLoading}>
                  Save & Send Email Notifications
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ADD MEMBER TO SPECIFIC GROUP MODAL */}
      {addingMemberToGroupId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="glass" className="max-w-md w-full p-6 border-slate-800 space-y-4 bg-slate-950/95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                Add Members to Group
              </h3>
              <button onClick={() => setAddingMemberToGroupId(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select from unassigned single members to add to this delegation group:
            </p>

            {singleParticipants.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">No single unassigned members available.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                {singleParticipants.map((member) => {
                  const isSelected = selectedSingleMemberIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSingleMemberIds([...selectedSingleMemberIds, member.id]);
                            } else {
                              setSelectedSingleMemberIds(selectedSingleMemberIds.filter((id) => id !== member.id));
                            }
                          }}
                          className="rounded text-indigo-500 bg-slate-900 border-slate-700"
                        />
                        <span className="font-medium truncate">{member.name || member.email}</span>
                      </div>
                      {member.participantType && (
                        <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                          {member.participantType.name}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setAddingMemberToGroupId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={selectedSingleMemberIds.length === 0}
                isLoading={actionLoading}
                onClick={() => handleAddMembersToGroup(addingMemberToGroupId, selectedSingleMemberIds)}
              >
                Add & Send Email Notifications
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MOVE MEMBER MODAL */}
      {movingMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="glass" className="max-w-md w-full p-6 border-slate-800 space-y-4 bg-slate-950/95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                Move Delegate
              </h3>
              <button onClick={() => setMovingMember(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
              <div className="font-bold text-white">{movingMember.name || 'Delegate'}</div>
              <div className="text-slate-400">{movingMember.email}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Select Destination Group:
              </label>
              <select
                id="targetGroupSelect"
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white rounded-xl px-3.5 py-2.5 outline-none"
              >
                <option value="">-- Remove from Group (Become Single Delegate) --</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    👥 {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setMovingMember(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={actionLoading}
                onClick={() => {
                  const select = document.getElementById('targetGroupSelect') as HTMLSelectElement;
                  const targetGroupId = select.value || null;
                  handleMoveMember(movingMember.id, targetGroupId);
                }}
              >
                Move Delegate & Send Email
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
