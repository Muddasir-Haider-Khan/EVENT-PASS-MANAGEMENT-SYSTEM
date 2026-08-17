'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

type FieldType = 'SHORT_TEXT' | 'PARAGRAPH' | 'EMAIL' | 'NUMBER' | 'DROPDOWN' | 'RADIO' | 'CHECKBOX' | 'DATE';

interface FormField {
  id?: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[] | null;
  order: number;
  isLocked: boolean;
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  SHORT_TEXT: 'Short Text Input',
  PARAGRAPH: 'Paragraph Text',
  EMAIL: 'Email Address',
  NUMBER: 'Numeric Value',
  DROPDOWN: 'Dropdown Select',
  RADIO: 'Multiple Choice Radio',
  CHECKBOX: 'Checkboxes Group',
  DATE: 'Date Selector',
};

const NEEDS_OPTIONS: FieldType[] = ['DROPDOWN', 'RADIO', 'CHECKBOX'];

export default function FormBuilderPage() {
  const { toast } = useToast();
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/manager/form-fields');
      if (res.ok) {
        const data = await res.json();
        setFields(data.fields);
      }
      setLoading(false);
    }
    load();
  }, []);

  function addField() {
    setFields([...fields, {
      label: '',
      type: 'SHORT_TEXT',
      required: false,
      options: null,
      order: fields.length,
      isLocked: false,
    }]);
  }

  function updateField(index: number, updates: Partial<FormField>) {
    setFields(fields.map((f, i) => i === index ? { ...f, ...updates } : f));
  }

  function removeField(index: number) {
    if (fields[index].isLocked) return;
    setFields(fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i })));
  }

  function moveField(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields.map((f, i) => ({ ...f, order: i })));
  }

  async function handleSave() {
    for (const field of fields) {
      if (!field.label.trim()) {
        toast('All fields must have a descriptive label', 'error');
        return;
      }
      if (NEEDS_OPTIONS.includes(field.type) && (!field.options || field.options.length === 0)) {
        toast(`"${field.label}" requires at least one choice option`, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/manager/form-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      if (res.ok) {
        const data = await res.json();
        setFields(data.fields);
        toast('Registration form structure saved successfully', 'success');
      } else {
        const data = await res.json();
        toast(data.error || 'Save failed', 'error');
      }
    } catch {
      toast('Network communication error', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--gold-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="text-overline" style={{ color: 'var(--gold-light)' }}>27 MEDIA AGENCY • REGISTRATION STUDIO</span>
          <h1 className="text-headline gold-gradient-text" style={{ marginTop: 4 }}>
            Dynamic Form Builder
          </h1>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Customize attendee fields and requirements for public pass registration.
          </p>
        </div>

        <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : 'Save Form Layout →'}
        </button>
      </div>

      <div>
        {fields.map((field, index) => (
          <div key={field.id || index} className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {field.isLocked ? (
                  <span className="badge badge-gold">System Required</span>
                ) : (
                  <span className="badge badge-neutral">Custom Field #{index + 1}</span>
                )}
                <span className="text-overline" style={{ color: 'var(--text-muted)' }}>
                  {FIELD_TYPE_LABELS[field.type]}
                </span>
              </div>

              {!field.isLocked && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => moveField(index, -1)} disabled={index === 0}>↑ Move Up</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => moveField(index, 1)} disabled={index === fields.length - 1}>↓ Move Down</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => removeField(index)}>✕ Delete</button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14 }}>
                <div>
                  <label className="input-label">Field Label *</label>
                  <input
                    className="input"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    placeholder="e.g. Full Name or VIP Company"
                    disabled={field.isLocked}
                  />
                </div>
                {!field.isLocked && (
                  <div style={{ width: 220 }}>
                    <label className="input-label">Field Type</label>
                    <select
                      className="select"
                      value={field.type}
                      onChange={(e) => updateField(index, {
                        type: e.target.value as FieldType,
                        options: NEEDS_OPTIONS.includes(e.target.value as FieldType) ? [''] : null,
                      })}
                    >
                      {Object.entries(FIELD_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {NEEDS_OPTIONS.includes(field.type) && (
                <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 10, border: '1px solid var(--border-default)' }}>
                  <label className="input-label" style={{ marginBottom: 8 }}>Dropdown / Choice Options</label>
                  {(field.options || []).map((opt, optIdx) => (
                    <div key={optIdx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        className="input"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(field.options || [])];
                          newOpts[optIdx] = e.target.value;
                          updateField(index, { options: newOpts });
                        }}
                        placeholder={`Choice #${optIdx + 1}`}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--error)' }}
                        onClick={() => {
                          const newOpts = (field.options || []).filter((_, i) => i !== optIdx);
                          updateField(index, { options: newOpts });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--gold-light)' }}
                    onClick={() => updateField(index, { options: [...(field.options || []), ''] })}
                  >
                    + Add Option Choice
                  </button>
                </div>
              )}

              {!field.isLocked && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    style={{ accentColor: 'var(--gold-primary)', width: 16, height: 16 }}
                  />
                  <span className="text-caption" style={{ color: '#F8FAFC' }}>Require response for form submission</span>
                </label>
              )}
            </div>
          </div>
        ))}

        <button className="btn btn-ghost" style={{ width: '100%', height: 44, border: '1px dashed var(--border-hover)', marginTop: 8 }} onClick={addField}>
          + Add New Custom Field
        </button>
      </div>
    </div>
  );
}
