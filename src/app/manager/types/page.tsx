'use client';

import { useEffect, useState } from 'react';
import { PageHead } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Users,
  Download,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Save,
  Search,
  Eye,
  X,
  FileText,
  Clock,
  } from 'lucide-react';

interface FormFieldItem {
  id?: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  order: number;
  isLocked?: boolean;
}

interface ParticipantType {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  isGroup?: boolean;
  groupSize?: number;
  validDays?: number;
  formFields?: FormFieldItem[];
  _count?: {
    submissions: number;
    participants: number;
    formFields: number;
  };
}

interface SubmissionItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  submittedAt: string;
  responses: Record<string, unknown>;
  participant?: {
    id: string;
    qrToken: string;
    entryStatus: string;
    createdAt: string;
  } | null;
}

export default function ManagerTypesPage() {
  const [types, setTypes] = useState<ParticipantType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [groupSize, setGroupSize] = useState<number>(4);
  const [validDays, setValidDays] = useState<number>(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // View Mode: 'list' | 'builder' | 'members'
  const [viewMode, setViewMode] = useState<'list' | 'builder' | 'members'>('list');
  const [activeCategory, setActiveCategory] = useState<ParticipantType | null>(null);

  // Form Builder State
  const [builderFields, setBuilderFields] = useState<FormFieldItem[]>([]);
  const [savingFields, setSavingFields] = useState(false);

  // Submissions & Members View State
  const [categorySubmissions, setCategorySubmissions] = useState<SubmissionItem[]>([]);
  const [categoryFields, setCategoryFields] = useState<FormFieldItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  async function loadTypes() {
    try {
      const res = await fetch('/api/manager/participant-types');
      if (res.ok) {
        const data = await res.json();
        setTypes(data.participantTypes || []);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTypes();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/manager/participant-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isGroup, groupSize, validDays }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Participant category created successfully!' });
        setName('');
        setDescription('');
        setIsGroup(false);
        setGroupSize(4);
        setValidDays(1);
        loadTypes();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create category' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network request error' });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this participant category?')) return;
    try {
      const res = await fetch(`/api/manager/participant-types?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadTypes();
      }
    } catch {
      // Handled silently
    }
  }

  // --- FORM BUILDER MODE HANDLERS ---
  async function openFormBuilder(category: ParticipantType) {
    setActiveCategory(category);
    setViewMode('builder');
    setLoading(true);

    try {
      const res = await fetch(`/api/manager/participant-types/${category.id}/fields`);
      if (res.ok) {
        const data = await res.json();
        setBuilderFields(data.fields || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load category form fields' });
    } finally {
      setLoading(false);
    }
  }

  function addBuilderField() {
    setBuilderFields((prev) => [
      ...prev,
      {
        label: `Question ${prev.length + 1}`,
        type: 'SHORT_TEXT',
        required: false,
        options: null,
        order: prev.length,
      },
    ]);
  }

  function updateBuilderField(index: number, updates: Partial<FormFieldItem>) {
    setBuilderFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  }

  function removeBuilderField(index: number) {
    setBuilderFields((prev) => prev.filter((_, i) => i !== index));
  }

  function moveBuilderField(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= builderFields.length) return;

    const copy = [...builderFields];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Recalculate order values
    copy.forEach((f, i) => {
      f.order = i;
    });

    setBuilderFields(copy);
  }

  async function handleSaveFormLayout() {
    if (!activeCategory) return;
    setSavingFields(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/manager/participant-types/${activeCategory.id}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: builderFields }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Form layout for "${activeCategory.name}" saved successfully!` });
        loadTypes();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to save form layout' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network request error saving form layout' });
    } finally {
      setSavingFields(false);
    }
  }

  // --- SUBMISSIONS & MEMBERS MODE HANDLERS ---
  async function openMembersView(category: ParticipantType) {
    setActiveCategory(category);
    setViewMode('members');
    setLoadingMembers(true);

    try {
      const res = await fetch(`/api/manager/participant-types/${category.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setCategorySubmissions(data.submissions || []);
        setCategoryFields(data.fields || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load category members' });
    } finally {
      setLoadingMembers(false);
    }
  }

  // EXPORT TO EXCEL / CSV FUNCTIONALITY
  function exportCategoryToExcel() {
    if (!activeCategory || categorySubmissions.length === 0) {
      alert('No submission data available to export.');
      return;
    }

    // Prepare CSV Header
    const customFieldLabels = categoryFields.map((f) => f.label);
    const headers = [
      'Submission ID',
      'Full Name',
      'Email',
      'Phone',
      'Category',
      'Submission Status',
      'Submitted At',
      ...customFieldLabels,
    ];

    // Helper to safely format CSV values
    const sanitizeCsvValue = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // Prepare Rows
    const rows = categorySubmissions.map((sub) => {
      const baseValues = [
        sub.id,
        sub.fullName,
        sub.email,
        sub.phone || '',
        activeCategory.name,
        sub.status,
        new Date(sub.submittedAt).toLocaleString(),
      ];

      // Custom Field Values
      const customValues = categoryFields.map((field) => {
        let val = field.id ? sub.responses?.[field.id] : undefined;
        if (val === undefined) {
          // Check by label matching
          val = sub.responses?.[field.label] || (field.label ? sub.responses?.[field.label.toLowerCase()] : undefined);
        }
        if (Array.isArray(val)) return val.join('; ');
        return val || '';
      });

      return [...baseValues, ...customValues].map(sanitizeCsvValue).join(',');
    });

    const csvContent = [headers.map(sanitizeCsvValue).join(','), ...rows].join('\n');

    // Create Download Link
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${activeCategory.name.replace(/[^a-zA-Z0-9]/g, '_')}_Submissions_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filtered Submissions logic
  const filteredSubmissions = categorySubmissions.filter((sub) => {
    const matchesSearch =
      (sub.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.phone && sub.phone.includes(searchQuery));
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Global Banner Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg transition-all ${
            message.type === 'success'
              ? 'bg-positive-500/10 border border-positive-500/30 text-positive-400'
              : 'bg-negative-500/10 border border-negative-500/30 text-negative-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-positive-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-negative-400" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-ink-400 hover:text-ink-50">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW MODE 1: CATEGORY LIST HUB */}
      {viewMode === 'list' && (
        <>
          <PageHead
            title={<>Participant<br />Categories</>}
            description="Each category, such as Delegate or Observer, gets its own registration form, entry allowance and member list."
          />

          {/* Create New Category Form */}
          <Card variant="glass" className="p-6 border-ink-800 space-y-4">
            <h2 className="text-sm font-bold text-ink-50 flex items-center gap-2">
              <Plus className="w-4 h-4 text-muted" />
              Add New Participant Category
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="input-label">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Executive Delegate"
                    className="input"
                  />
                </div>

                <div>
                  <label className="input-label">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Standard committee delegate"
                    className="input"
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
                    Save Category
                  </Button>
                </div>
              </div>

              {/* Group Delegation Round Toggle & QR Validity Options */}
              <div className="pt-3 border-t border-ink-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <label
                    onClick={() => setIsGroup(!isGroup)}
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isGroup
                          ? 'bg-accent-600 border-accent-400 shadow-md'
                          : 'bg-ink-900 border-ink-700 group-hover:border-ink-500'
                      }`}
                    >
                      {isGroup && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs font-medium text-ink-200 group-hover:text-ink-50 transition-colors">
                      Is this a group delegation category?
                    </span>
                  </label>

                  {/* QR Code Validity Limit Input */}
                  <div className="flex items-center gap-2 bg-ink-900 border border-ink-700/80 px-3 py-1.5 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-positive-400" />
                    <label className="text-xs font-semibold text-ink-200">
                      QR Code Validity:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={validDays}
                      onChange={(e) => setValidDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 bg-ink-950 border border-positive-500/40 text-xs font-bold text-positive-400 rounded-lg px-2 py-1 outline-none text-center"
                    />
                    <span className="text-[11px] text-ink-400">Day(s) / Entry Limit</span>
                  </div>
                </div>

                {isGroup && (
                  <div className="flex items-center gap-2 bg-accent-950/30 border border-accent-500/30 px-3 py-1.5 rounded-xl animate-fadeIn">
                    <Users className="w-3.5 h-3.5 text-muted" />
                    <label className="text-xs font-semibold text-accent-200">
                      Delegation Member Count:
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={groupSize}
                      onChange={(e) => setGroupSize(parseInt(e.target.value, 10) || 2)}
                      className="w-16 bg-ink-950 border border-accent-500/40 text-xs font-bold text-ink-50 rounded-lg px-2 py-1 outline-none text-center"
                    />
                    <span className="text-[11px] text-ink-400">members / group</span>
                  </div>
                )}
              </div>
            </form>
          </Card>

          {/* Categories Grid */}
          <div className="space-y-3">
            <h2 className="card-title">
              Categories <span className="text-muted num">{types.length}</span>
            </h2>

            {loading ? (
              <div className="p-8 text-center text-xs text-ink-400">Loading categories...</div>
            ) : types.length === 0 ? (
              <Card variant="glass" className="p-8 text-center text-ink-400 text-xs border-ink-800">
                No participant categories created yet. Create your first category above.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {types.map((type) => (
                  <Card
                    key={type.id}
                    variant="glass"
                    className="p-5 border-ink-800 flex flex-col justify-between space-y-4 hover:border-ink-700 transition-all"
                  >
                    <div>
                      <h3 className="text-[17px] font-semibold">{type.name}</h3>
                      {type.description && <p className="text-[13px] text-muted mt-0.5">{type.description}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="chip">
                          <Clock className="w-3 h-3 text-muted" />
                          {type.validDays || 1} {(type.validDays || 1) === 1 ? 'entry' : 'entries'}
                        </span>
                        <span className="chip">
                          <Users className="w-3 h-3 text-muted" />
                          {type.isGroup ? `Group of ${type.groupSize || 4}` : 'Individual'}
                        </span>
                        <span className="chip">
                          {type._count?.formFields || type.formFields?.length || 0} form fields
                        </span>
                      </div>

                      <dl className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line">
                        <div>
                          <dt className="text-[12px] text-muted">Submissions</dt>
                          <dd className="stat__value">{type._count?.submissions || 0}</dd>
                        </div>
                        <div>
                          <dt className="text-[12px] text-muted">Pass holders</dt>
                          <dd className="stat__value">{type._count?.participants || 0}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs"
                        leftIcon={<FileEdit className="w-3.5 h-3.5 text-muted" />}
                        onClick={() => openFormBuilder(type)}
                      >
                        Design Form
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        leftIcon={<Users className="w-3.5 h-3.5 text-muted" />}
                        onClick={() => openMembersView(type)}
                      >
                        Members & Export
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(type.id)}
                        className="text-negative-400 hover:text-negative-300 p-2"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW MODE 2: CATEGORY FORM BUILDER */}
      {viewMode === 'builder' && activeCategory && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800 pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('list');
                  setActiveCategory(null);
                }}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-ink-50 flex items-center gap-2">
                  <FileEdit className="w-5 h-5 text-muted" />
                  Form Designer: <span className="text-accent-300">{activeCategory.name}</span>
                </h1>
                <p className="text-xs text-ink-400">
                  Configure specific questions & field types for users selecting the &quot;{activeCategory.name}&quot; category.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              isLoading={savingFields}
              onClick={handleSaveFormLayout}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Form Layout
            </Button>
          </div>

          {/* Form Fields List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="card-title">
                Form Questions ({builderFields.length})
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={addBuilderField}
                leftIcon={<Plus className="w-4 h-4 text-muted" />}
              >
                Add Custom Question
              </Button>
            </div>

            {builderFields.length === 0 ? (
              <Card variant="glass" className="p-8 text-center text-ink-400 text-xs border-ink-800">
                No custom questions defined for this category. Click &quot;Add Custom Question&quot; to build your form.
              </Card>
            ) : (
              <div className="space-y-3">
                {builderFields.map((field, idx) => (
                  <Card
                    key={idx}
                    variant="glass"
                    className="p-4 border-ink-800 transition-all hover:border-ink-700"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                      {/* Field Order & Drag Control */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveBuilderField(idx, 'up')}
                            className="text-ink-500 hover:text-ink-200 disabled:opacity-30"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === builderFields.length - 1}
                            onClick={() => moveBuilderField(idx, 'down')}
                            className="text-ink-500 hover:text-ink-200 disabled:opacity-30"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="w-6 h-6 rounded-full bg-ink-800 text-ink-400 flex items-center justify-center text-xs font-bold num">
                          {idx + 1}
                        </span>
                      </div>

                      {/* Field Label Input */}
                      <div className="flex-1">
                        <label className="input-label">
                          Question Label / Title
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateBuilderField(idx, { label: e.target.value })}
                          placeholder="e.g. Portfolio Link or University Name"
                          className="input"
                        />
                      </div>

                      {/* Field Type Select */}
                      <div className="w-full md:w-48">
                        <label className="input-label">
                          Input Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateBuilderField(idx, { type: e.target.value })}
                          className="select"
                        >
                          <option value="SHORT_TEXT">Short Text</option>
                          <option value="PARAGRAPH">Paragraph / Long Text</option>
                          <option value="EMAIL">Email Address</option>
                          <option value="NUMBER">Number</option>
                          <option value="DROPDOWN">Dropdown Menu</option>
                          <option value="RADIO">Radio Buttons</option>
                          <option value="CHECKBOX">Checkboxes</option>
                          <option value="DATE">Date Picker</option>
                        </select>
                      </div>

                      {/* Required Toggle & Actions */}
                      <div className="flex items-center gap-4 justify-between md:justify-end pt-2 md:pt-0">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateBuilderField(idx, { required: e.target.checked })}
                            className="rounded bg-ink-950 border-ink-800 text-accent-500 focus:ring-accent-500"
                          />
                          <span className="text-xs font-medium text-ink-300">Required</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => removeBuilderField(idx)}
                          className="text-ink-500 hover:text-negative-400 transition-colors p-1"
                          title="Remove Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Options Editor for Dropdown & Radio */}
                    {(field.type === 'DROPDOWN' || field.type === 'RADIO') && (
                      <div className="mt-3 pt-3 border-t border-ink-800/60 pl-8 space-y-2">
                        <label className="input-label !mb-0">
                          Options (Comma Separated)
                        </label>
                        <input
                          type="text"
                          value={(field.options || []).join(', ')}
                          onChange={(e) =>
                            updateBuilderField(idx, {
                              options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Option 1, Option 2, Option 3"
                          className="input !h-9"
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: CATEGORY MEMBERS & SUBMISSIONS DASHBOARD */}
      {viewMode === 'members' && activeCategory && (
        <div className="space-y-6">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800 pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('list');
                  setActiveCategory(null);
                }}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-ink-50 flex items-center gap-2">
                  <Users className="w-5 h-5 text-positive-400" />
                  {activeCategory.name} Submissions & Members
                </h1>
                <p className="text-xs text-ink-400">
                  View and manage all registered attendees for the {activeCategory.name} category.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={exportCategoryToExcel}
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-positive-600 hover:bg-positive-500"
            >
              Export to Excel (CSV)
            </Button>
          </div>

          {/* Filters & Search */}
          <Card variant="glass" className="p-4 border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-ink-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="input !pl-9"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'APPROVED', 'PENDING', 'DECLINED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-accent-600 text-white shadow-md'
                      : 'bg-ink-900 text-ink-400 hover:text-ink-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </Card>

          {/* Members & Submissions Table */}
          {loadingMembers ? (
            <div className="p-12 text-center text-xs text-ink-400">Loading submission data...</div>
          ) : filteredSubmissions.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-ink-400 text-xs border-ink-800">
              No submissions found matching your search or filter.
            </Card>
          ) : (
            <Card variant="glass" className="p-0 border-ink-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-ink-300">
                  <thead className="text-muted text-[12px] font-semibold border-b border-line">
                    <tr>
                      <th className="p-4">Attendee Name</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Submitted Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/60">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-ink-900/30 transition-colors">
                        <td className="p-4 font-semibold text-ink-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-ink-800 flex items-center justify-center text-accent-400 font-bold text-xs">
                              {sub.fullName ? sub.fullName.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <div>{sub.fullName}</div>
                              {sub.participant?.qrToken && (
                                <div className="text-[12px] text-muted">
                                  Pass: #{sub.participant.qrToken.slice(0, 8)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div>{sub.email}</div>
                          {sub.phone && <div className="text-ink-500 text-[11px]">{sub.phone}</div>}
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              sub.status === 'APPROVED'
                                ? 'bg-positive-500/10 text-positive-400 border border-positive-500/20'
                                : sub.status === 'DECLINED'
                                ? 'bg-negative-500/10 text-negative-400 border border-negative-500/20'
                                : 'bg-caution-500/10 text-caution-400 border border-caution-500/20'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>

                        <td className="p-4 text-ink-400">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </td>

                        <td className="p-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSubmission(sub)}
                            leftIcon={<Eye className="w-3.5 h-3.5 text-muted" />}
                          >
                            View Form Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* SUBMISSION DETAILS MODAL */}
      {selectedSubmission && activeCategory && (
        <div className="fixed inset-0 z-50 bg-[var(--scrim)] flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-xl border-ink-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <h3 className="text-base font-bold text-ink-50 flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted" />
                Category Form Answers ({activeCategory.name})
              </h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-ink-400 hover:text-ink-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-ink-900/60 p-4 rounded-xl border border-ink-800/80 space-y-1">
                <div className="text-sm font-bold text-ink-50">{selectedSubmission.fullName}</div>
                <div className="text-xs text-ink-400">{selectedSubmission.email} • {selectedSubmission.phone || 'No phone'}</div>
                <div className="text-[12px] text-muted mt-1">Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
              </div>

              {/* Group Delegation Members Display */}
              {Array.isArray(selectedSubmission.responses?.groupMembers) &&
                (selectedSubmission.responses.groupMembers as Array<Record<string, unknown>>).length > 0 && (
                  <div className="space-y-3 p-4 bg-accent-950/20 border border-accent-500/30 rounded-xl">
                    <h4 className="text-[13px] font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted" />
                      Delegation Group: {String(selectedSubmission.responses.groupName || 'Group Members')}
                    </h4>
                    <div className="space-y-2">
                      {(selectedSubmission.responses.groupMembers as Array<Record<string, unknown>>).map((m: Record<string, unknown>, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-ink-950/80 border border-ink-800/80 text-xs">
                          <div className="flex items-center gap-3">
                            {m.photoUrl ? (
                              <img src={String(m.photoUrl)} alt={String(m.name || '')} className="w-8 h-8 rounded-full object-cover border border-accent-500/40" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-ink-800 flex items-center justify-center text-[10px] font-bold text-ink-300">
                                #{idx + 1}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-ink-50 flex items-center gap-1.5">
                                {String(m.name || '')}
                                {Boolean(m.isLeader) && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-caution-500/20 text-caution-300 border border-caution-500/30">
                                    Leader
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-ink-400">{String(m.email || '')} • {String(m.phone || 'No phone')}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="space-y-3">
                <h4 className="text-[13px] font-semibold text-muted">Custom Questionnaire Responses</h4>

                {categoryFields.length === 0 ? (
                  <p className="text-xs text-ink-500 italic">No custom fields defined for this category form.</p>
                ) : (
                  categoryFields.map((field, fIdx) => {
                    let val = field.id ? selectedSubmission.responses?.[field.id] : undefined;
                    if (val === undefined) {
                      val = selectedSubmission.responses?.[field.label] || (field.label ? selectedSubmission.responses?.[field.label.toLowerCase()] : undefined);
                    }

                    return (
                      <div key={field.id || fIdx} className="p-3 rounded-xl bg-ink-950/80 border border-ink-800/60 space-y-1">
                        <span className="text-[11px] font-semibold text-ink-400 block">{field.label}</span>
                        <div className="text-xs text-ink-50 font-medium">
                          {Array.isArray(val) ? val.join(', ') : val !== undefined && val !== null && val !== '' ? String(val) : <span className="text-ink-600 italic">Not provided</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-ink-800 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedSubmission(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
