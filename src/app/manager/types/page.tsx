'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { Plus, Trash2, Edit3, Layers } from 'lucide-react';


interface CustomField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  order: number;
}

interface ParticipantTypeItem {
  id: string;
  name: string;
  description: string | null;
  fee: number;
  isGroupType: boolean;
  minGroupSize: number;
  maxGroupSize: number;
  order: number;
  customFields: CustomField[];
  _count: {
    participants: number;
    submissions: number;
  };
}

export default function ParticipantTypesPage() {
  const { toast } = useToast();
  const [types, setTypes] = useState<ParticipantTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<ParticipantTypeItem | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    description: '',
    fee: 0,
    isGroupType: false,
    minGroupSize: 1,
    maxGroupSize: 10,
  });

  // Custom Field Form State for selected type
  const [activeTypeId, setActiveTypeId] = useState<string | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    label: '',
    type: 'SHORT_TEXT',
    required: false,
    optionsStr: '',
  });

  const loadTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/participant-types');
      if (res.ok) {
        const data = await res.json();
        setTypes(data.types || []);
      }
    } catch {
      toast('Failed to load participant types', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  function openCreateModal() {
    setEditingType(null);
    setForm({
      name: '',
      description: '',
      fee: 0,
      isGroupType: false,
      minGroupSize: 1,
      maxGroupSize: 10,
    });
    setShowModal(true);
  }

  function openEditModal(t: ParticipantTypeItem) {
    setEditingType(t);
    setForm({
      name: t.name,
      description: t.description || '',
      fee: t.fee,
      isGroupType: t.isGroupType,
      minGroupSize: t.minGroupSize,
      maxGroupSize: t.maxGroupSize,
    });
    setShowModal(true);
  }

  async function handleSaveType(e: React.FormEvent) {
    e.preventDefault();
    try {
      const method = editingType ? 'PUT' : 'POST';
      const url = editingType
        ? `/api/manager/participant-types/${editingType.id}`
        : '/api/manager/participant-types';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.error || 'Failed to save type', 'error');
        return;
      }

      toast(editingType ? 'Participant type updated' : 'Participant type created', 'success');
      setShowModal(false);
      loadTypes();
    } catch {
      toast('Network error saving type', 'error');
    }
  }

  async function handleDeleteType(id: string) {
    if (!confirm('Are you sure you want to delete this participant type?')) return;
    try {
      const res = await fetch(`/api/manager/participant-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Participant type removed', 'success');
        loadTypes();
      } else {
        const err = await res.json();
        toast(err.error || 'Delete failed', 'error');
      }
    } catch {
      toast('Network error deleting type', 'error');
    }
  }

  async function handleAddField(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTypeId) return;

    const options = fieldForm.optionsStr
      ? fieldForm.optionsStr.split('\n').map((s) => s.trim()).filter(Boolean)
      : null;

    try {
      const res = await fetch(`/api/manager/participant-types/${activeTypeId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: fieldForm.label,
          type: fieldForm.type,
          required: fieldForm.required,
          options,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.error || 'Failed to add custom field', 'error');
        return;
      }

      toast('Custom field added', 'success');
      setShowFieldModal(false);
      setFieldForm({ label: '', type: 'SHORT_TEXT', required: false, optionsStr: '' });
      loadTypes();
    } catch {
      toast('Network error adding field', 'error');
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
            <Layers className="w-4 h-4" />
            <span>MUN Event Architecture</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Participant Types & Registration Tiers</h1>
          <p className="text-xs text-slate-400 mt-1">
            Define Delegate, Chair, Observer, or Group Delegation categories with customized pricing & custom form questions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Participant Type</span>
        </button>
      </div>

      {/* Roster of Types */}
      {types.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No Participant Types Configured</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create participant types such as &quot;Single Delegate&quot;, &quot;Executive Board Chair&quot;, or &quot;Delegation Group&quot; to open registration.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Type</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {types.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition flex flex-col justify-between space-y-6 shadow-xl"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                      {t.isGroupType ? `Group Delegation (${t.minGroupSize}-${t.maxGroupSize} Members)` : 'Individual Attendee'}
                    </span>
                    <h2 className="text-lg font-bold text-white">{t.name}</h2>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Edit Type"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteType(t.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                      title="Delete Type"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4">{t.description || 'No description provided.'}</p>

                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Registration Fee</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {t.fee > 0 ? `$${t.fee}` : 'Free'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Submissions</span>
                    <span className="text-sm font-bold text-white">{t._count.submissions}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pass Holders</span>
                    <span className="text-sm font-bold text-indigo-400">{t._count.participants}</span>
                  </div>
                </div>

                {/* Custom Type Fields */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300">
                      Type Custom Questions ({t.customFields.length})
                    </span>
                    <button
                      onClick={() => {
                        setActiveTypeId(t.id);
                        setShowFieldModal(true);
                      }}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {t.customFields.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No custom fields for this type yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {t.customFields.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between px-3 py-1.5 bg-slate-950/40 rounded-lg border border-slate-800/80 text-xs"
                        >
                          <span className="text-slate-300 font-medium">{f.label}</span>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{f.type}</span>
                            {f.required && <span className="text-amber-400 font-bold">Req</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create/Edit Type */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingType ? 'Edit Participant Type' : 'Create Participant Type'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveType} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Type Title *</label>
                <input
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Single Delegate, Committee Chair, Faculty Advisor"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  rows={2}
                  placeholder="Guidelines or committee requirements for this type..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Registration Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={form.isGroupType}
                      onChange={(e) => setForm({ ...form, isGroupType: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-300">Is Group Delegation?</span>
                  </label>
                </div>
              </div>

              {form.isGroupType && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Min Group Size</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      value={form.minGroupSize}
                      onChange={(e) => setForm({ ...form, minGroupSize: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Max Group Size</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      value={form.maxGroupSize}
                      onChange={(e) => setForm({ ...form, maxGroupSize: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
                  Save Participant Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Question Field */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Custom Question for Type</h3>
              <button onClick={() => setShowFieldModal(false)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddField} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Field Label *</label>
                <input
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Preferred MUN Committee, Emergency Contact Phone"
                  value={fieldForm.label}
                  onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Input Type</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={fieldForm.type}
                    onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })}
                  >
                    <option value="SHORT_TEXT">Short Text</option>
                    <option value="PARAGRAPH">Paragraph</option>
                    <option value="EMAIL">Email</option>
                    <option value="NUMBER">Number</option>
                    <option value="DROPDOWN">Dropdown Options</option>
                    <option value="RADIO">Radio Buttons</option>
                    <option value="CHECKBOX">Checkbox</option>
                    <option value="DATE">Date</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={fieldForm.required}
                      onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                    />
                    <span className="text-xs font-semibold text-slate-300">Required Field</span>
                  </label>
                </div>
              </div>

              {(fieldForm.type === 'DROPDOWN' || fieldForm.type === 'RADIO') && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Options (1 option per line)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder={"Option A\nOption B\nOption C"}
                    value={fieldForm.optionsStr}
                    onChange={(e) => setFieldForm({ ...fieldForm, optionsStr: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFieldModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Add Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
