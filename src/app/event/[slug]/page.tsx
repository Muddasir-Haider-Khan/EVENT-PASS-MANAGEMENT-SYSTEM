'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ImageUpload } from '@/components/ImageUpload';
import {
  Ticket,
  MapPin,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Send,
  AlertCircle,
  Camera,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  FileText,
  Users,
} from 'lucide-react';

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  order: number;
}

interface ParticipantType {
  id: string;
  name: string;
  description: string | null;
  price?: number | null;
  isGroup?: boolean;
  groupSize?: number;
  formFields?: Field[];
}

interface EventInfo {
  id: string;
  name: string;
  venue: string;
  eventDate: string | null;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
  fontUrl?: string | null;
  eventType?: 'NORMAL' | 'MUN';
}

interface GroupMember {
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
  isLeader: boolean;
}

export default function PublicEventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [participantTypes, setParticipantTypes] = useState<ParticipantType[]>([]);
  const [payment, setPayment] = useState<{ accountNumber?: string; paymentPhone?: string }>({});

  // Form State
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [responses, setResponses] = useState<Record<string, unknown>>({});

  // Group Delegation State
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [activeMemberTab, setActiveMemberTab] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/public/${slug}/form`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setEvent(data.event);
        setFields(data.fields || []);
        setParticipantTypes(data.participantTypes || []);
        setPayment(data.payment || {});

        // Pre-select first participant type if MUN
        if (data.participantTypes && data.participantTypes.length > 0) {
          setSelectedTypeId(data.participantTypes[0].id);
        }
      } catch {
        // Handled silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Dynamically load custom font stylesheet if provided
  useEffect(() => {
    if (event?.fontUrl) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = event.fontUrl;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [event?.fontUrl]);

  // Selected category custom form fields (strictly sync with Form Builder)
  const selectedCategory = participantTypes.find((t) => t.id === selectedTypeId);
  const activeFields = selectedCategory
    ? (selectedCategory.formFields || [])
    : (fields || []);

  // Initialize group members whenever a group category is selected
  useEffect(() => {
    if (selectedCategory?.isGroup) {
      const size = selectedCategory.groupSize || 4;
      setGroupMembers((prev) => {
        if (prev.length === size) return prev;
        return Array.from({ length: size }, (_, i) => ({
          name: prev[i]?.name || '',
          email: prev[i]?.email || '',
          phone: prev[i]?.phone || '',
          photoUrl: prev[i]?.photoUrl || '',
          isLeader: i === 0,
        }));
      });
    }
  }, [selectedCategory]);

  function updateGroupMember(index: number, field: keyof GroupMember, value: unknown) {
    setGroupMembers((prev) => {
      const updated = [...prev];
      if (field === 'isLeader') {
        return updated.map((m, i) => ({ ...m, isLeader: i === index }));
      }
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    let submitEmail = email;
    let submitPhone = phone;
    let submitFullName = fullName;
    let submitPhotoUrl = photoUrl;

    const updatedResponses: Record<string, unknown> = { ...responses };

    if (selectedCategory?.isGroup) {
      if (!groupName.trim()) {
        setError('Please enter a delegation / group name.');
        setSubmitting(false);
        return;
      }

      // Check group members completeness
      for (let i = 0; i < groupMembers.length; i++) {
        const m = groupMembers[i];
        if (!m.name || !m.email) {
          setError(`Delegation Member #${i + 1} is missing Name or Email.`);
          setSubmitting(false);
          return;
        }
      }

      const leader = groupMembers.find((m) => m.isLeader) || groupMembers[0];
      submitEmail = leader.email;
      submitPhone = leader.phone;
      submitFullName = leader.name;
      submitPhotoUrl = leader.photoUrl;

      updatedResponses.groupName = groupName;
      updatedResponses.groupMembers = groupMembers;
    }

    updatedResponses.fullName = submitFullName;

    activeFields.forEach((field) => {
      const labelLower = (field.label || '').toLowerCase().trim();
      if (field.type === 'EMAIL' || labelLower === 'email' || labelLower === 'email address') {
        updatedResponses[field.id] = submitEmail;
      }
      if (
        (field.type === 'SHORT_TEXT' || field.type === 'NUMBER') &&
        (labelLower.includes('phone') || labelLower.includes('whatsapp')) &&
        submitPhone
      ) {
        updatedResponses[field.id] = submitPhone;
      }
    });

    try {
      const res = await fetch(`/api/public/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: submitEmail,
          phone: submitPhone,
          photoUrl: submitPhotoUrl,
          participantTypeId: selectedTypeId,
          responses: updatedResponses,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch {
      setError('Network communication error');
    } finally {
      setSubmitting(false);
    }
  }

  function updateResponse(fieldId: string, value: unknown) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  }

  const isMun = event?.eventType === 'MUN';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card variant="glass" className="max-w-md w-full p-8 text-center border-slate-800">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Event Registration Unavailable</h1>
          <p className="text-sm text-slate-400">
            This event pass registration link is either invalid, inactive, or has closed.
          </p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <ThemeProvider
        primaryColor={event.primaryColor}
        secondaryColor={event.secondaryColor}
        accentColor={event.accentColor}
        fontFamily={event.fontFamily}
      >
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 antialiased">
          <Card variant="glass" className="max-w-lg w-full p-8 text-center border-slate-800 shadow-2xl space-y-6">
            {event.logoUrl ? (
              <img
                src={event.logoUrl}
                alt={event.name}
                className="w-20 h-20 rounded-2xl object-cover mx-auto border border-slate-700 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <Ticket className="w-8 h-8" />
              </div>
            )}

            <div>
              <Badge variant="green" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Registration Submitted
              </Badge>
              <h1 className="text-2xl font-bold text-white tracking-tight mt-3 mb-2">
                Registration Received!
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Your application for <strong className="text-white">{event.name}</strong> has been successfully submitted.
                Your official pass and entry QR code will be generated upon approval.
              </p>
            </div>

            {(payment.accountNumber || payment.paymentPhone) && (
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-4">
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                  Payment & Verification Instructions
                </h3>

                {payment.accountNumber && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Bank Account / IBAN
                    </span>
                    <div className="flex items-center justify-between mt-1 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="font-mono text-sm font-semibold text-white">
                        {payment.accountNumber}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        onClick={() => {
                          navigator.clipboard.writeText(payment.accountNumber || '');
                          setCopiedAcc(true);
                          setTimeout(() => setCopiedAcc(false), 2000);
                        }}
                      >
                        {copiedAcc ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                )}

                {payment.paymentPhone && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Send Receipt via WhatsApp
                    </span>
                    <div className="flex items-center justify-between mt-1 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="font-mono text-sm font-semibold text-amber-300">
                        {payment.paymentPhone}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        onClick={() => {
                          navigator.clipboard.writeText(payment.paymentPhone || '');
                          setCopiedPhone(true);
                          setTimeout(() => setCopiedPhone(false), 2000);
                        }}
                      >
                        {copiedPhone ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      primaryColor={event.primaryColor}
      secondaryColor={event.secondaryColor}
      accentColor={event.accentColor}
      fontFamily={event.fontFamily}
    >
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 antialiased">
        <div className="max-w-xl w-full space-y-6">
          {/* White-labeled Event Header */}
          <div className="text-center space-y-3">
            {event.logoUrl && (
              <img
                src={event.logoUrl}
                alt={event.name}
                className="w-24 h-24 rounded-2xl object-cover mx-auto mb-2 border border-slate-700 shadow-xl"
              />
            )}
            <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
              {event.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{event.venue}</span>
              </span>
              {event.eventDate && (
                <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {new Date(event.eventDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              )}
            </div>

            {event.description && (
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Form Card */}
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 shadow-2xl">
            {/* Step Wizard Indicator */}
            {(isMun || participantTypes.length > 0) && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span className="text-indigo-400">Step {step} of 3</span>
                  <span>
                    {step === 1 && 'Select Category'}
                    {step === 2 && (selectedCategory?.isGroup ? 'Delegation Members' : 'Personal Details')}
                    {step === 3 && 'Event Questionnaire'}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* STEP 1: Select Category */}
              {participantTypes.length > 0 && step === 1 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                      Select Registration Category
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose your participant type to continue registration.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {participantTypes.map((type) => (
                      <div
                        key={type.id}
                        onClick={() => setSelectedTypeId(type.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedTypeId === type.id
                            ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white flex items-center gap-2">
                            {type.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {type.isGroup ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center gap-1">
                                <Users className="w-3 h-3" /> Group ({type.groupSize || 4} Members)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                                Single Participant
                              </span>
                            )}
                            {selectedTypeId === type.id && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>
                        </div>
                        {type.description && (
                          <p className="text-xs text-slate-400 mt-1">{type.description}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    className="w-full mt-4"
                    disabled={!selectedTypeId}
                    onClick={() => {
                      setError('');
                      setStep(2);
                    }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next: Enter Details
                  </Button>
                </div>
              )}

              {/* STEP 2: Participant Details (Single vs Group Delegation) */}
              {step === 2 && (
                <div className="space-y-4">
                  {selectedCategory?.isGroup ? (
                    // GROUP DELEGATION REGISTRATION FORM
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-3">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          Group Delegation Registration ({selectedCategory.groupSize || 4} Members)
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          Please enter your delegation group name and details for all {selectedCategory.groupSize || 4} members.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                          Delegation / Group Name <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          required
                          placeholder="e.g. Alpha Delegation / Team Vanguard"
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none"
                        />
                      </div>

                      {/* Member Tab Navigation */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
                        {groupMembers.map((m, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveMemberTab(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                              activeMemberTab === idx
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>Member #{idx + 1}</span>
                            {m.isLeader && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                Leader
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Active Member Form Inputs */}
                      {groupMembers[activeMemberTab] && (
                        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Member #{activeMemberTab + 1} Profile
                            </span>
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300">
                              <input
                                type="radio"
                                name="groupLeaderSelection"
                                checked={groupMembers[activeMemberTab].isLeader}
                                onChange={() => updateGroupMember(activeMemberTab, 'isLeader', true)}
                                className="w-3.5 h-3.5 accent-amber-400 cursor-pointer"
                              />
                              <span className="font-semibold">Designate as Group Leader</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={groupMembers[activeMemberTab].name}
                              onChange={(e) => updateGroupMember(activeMemberTab, 'name', e.target.value)}
                              required
                              placeholder="Member full name"
                              className="w-full bg-slate-950/80 border border-slate-800 text-xs text-white rounded-lg px-3 py-2.5 outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                              Email Address (Pass will be sent here) *
                            </label>
                            <input
                              type="email"
                              value={groupMembers[activeMemberTab].email}
                              onChange={(e) => updateGroupMember(activeMemberTab, 'email', e.target.value)}
                              required
                              placeholder="member.email@example.com"
                              className="w-full bg-slate-950/80 border border-slate-800 text-xs text-white rounded-lg px-3 py-2.5 outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                              Phone / WhatsApp *
                            </label>
                            <input
                              type="tel"
                              value={groupMembers[activeMemberTab].phone}
                              onChange={(e) => updateGroupMember(activeMemberTab, 'phone', e.target.value)}
                              required
                              placeholder="+92 300 1234567"
                              className="w-full bg-slate-950/80 border border-slate-800 text-xs text-white rounded-lg px-3 py-2.5 outline-none focus:border-purple-500"
                            />
                          </div>

                          <ImageUpload
                            label={`Member #${activeMemberTab + 1} Security Photo *`}
                            value={groupMembers[activeMemberTab].photoUrl}
                            onChange={(url) => updateGroupMember(activeMemberTab, 'photoUrl', url)}
                            folder={`/epms/group-${slug}/photos`}
                            helpText="Member face photo for gate entry verification."
                          />
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-1/2"
                          onClick={() => setStep(1)}
                          leftIcon={<ArrowLeft className="w-4 h-4" />}
                        >
                          Back: Categories
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          className="w-1/2"
                          onClick={() => {
                            setError('');
                            setStep(3);
                          }}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          Next: Questionnaire
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // SINGLE PARTICIPANT REGISTRATION FORM
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-3">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-indigo-400" />
                          Contact & Security Details
                        </h2>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                          Full Name <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          placeholder="e.g. John Doe"
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                          Email Address <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="your.email@example.com"
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                          Phone / WhatsApp Number <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          placeholder="e.g. +92 300 1234567"
                          className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none"
                        />
                      </div>

                      <ImageUpload
                        label="Participant Face Photo *"
                        value={photoUrl}
                        onChange={(url) => setPhotoUrl(url)}
                        folder={`/epms/mun-${slug}/photos`}
                        helpText="Your photo will be displayed to gate security personnel upon QR scan."
                      />

                      <div className="flex gap-3 pt-2">
                        {participantTypes.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-1/2"
                            onClick={() => setStep(1)}
                            leftIcon={<ArrowLeft className="w-4 h-4" />}
                          >
                            Back: Categories
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="primary"
                          className={participantTypes.length > 0 ? 'w-1/2' : 'w-full'}
                          disabled={!email || !fullName || !phone}
                          onClick={() => {
                            setError('');
                            setStep(3);
                          }}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          Next: Questionnaire
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Event Questionnaire & Submit */}
              {(step === 3 || (participantTypes.length === 0 && !isMun)) && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3 mb-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      Event Questionnaire Answers
                    </h2>
                  </div>

                  {activeFields.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
                      No additional custom questionnaire fields for this category. Ready to submit!
                    </div>
                  ) : (
                    activeFields.map((field) => (
                        <div key={field.id} className="space-y-1.5">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                            {field.label} {field.required && <span className="text-amber-400">*</span>}
                          </label>

                          {field.type === 'SHORT_TEXT' ? (
                            <input
                              type="text"
                              value={(responses[field.id] as string) || ''}
                              onChange={(e) => updateResponse(field.id, e.target.value)}
                              required={field.required}
                              placeholder={`Enter ${(field.label || '').toLowerCase()}...`}
                              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none"
                            />
                          ) : field.type === 'PARAGRAPH' ? (
                            <textarea
                              rows={3}
                              value={(responses[field.id] as string) || ''}
                              onChange={(e) => updateResponse(field.id, e.target.value)}
                              required={field.required}
                              placeholder={`Enter ${(field.label || '').toLowerCase()}...`}
                              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 rounded-xl p-4 outline-none resize-y"
                            />
                          ) : field.type === 'NUMBER' ? (
                            <input
                              type="number"
                              value={(responses[field.id] as string) || ''}
                              onChange={(e) => updateResponse(field.id, e.target.value)}
                              required={field.required}
                              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none"
                            />
                          ) : field.type === 'DATE' ? (
                            <input
                              type="date"
                              value={(responses[field.id] as string) || ''}
                              onChange={(e) => updateResponse(field.id, e.target.value)}
                              required={field.required}
                              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none"
                            />
                          ) : field.type === 'DROPDOWN' ? (
                            <select
                              value={(responses[field.id] as string) || ''}
                              onChange={(e) => updateResponse(field.id, e.target.value)}
                              required={field.required}
                              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm text-white rounded-xl px-4 py-3 outline-none"
                            >
                              <option value="">-- Choose Option --</option>
                              {(field.options || []).map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : field.type === 'RADIO' ? (
                            <div className="space-y-2 pt-1">
                              {(field.options || []).map((opt, i) => (
                                <label key={i} className="flex items-center gap-3 cursor-pointer text-sm text-slate-200">
                                  <input
                                    type="radio"
                                    name={field.id}
                                    value={opt}
                                    checked={responses[field.id] === opt}
                                    onChange={() => updateResponse(field.id, opt)}
                                    required={field.required}
                                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : field.type === 'CHECKBOX' ? (
                            <div className="space-y-2 pt-1">
                              {(field.options || []).map((opt, i) => (
                                <label key={i} className="flex items-center gap-3 cursor-pointer text-sm text-slate-200">
                                  <input
                                    type="checkbox"
                                    checked={((responses[field.id] as string[]) || []).includes(opt)}
                                    onChange={(e) => {
                                      const cur = (responses[field.id] as string[]) || [];
                                      updateResponse(
                                        field.id,
                                        e.target.checked ? [...cur, opt] : cur.filter((v: string) => v !== opt)
                                      );
                                    }}
                                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    {participantTypes.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-1/3"
                        onClick={() => setStep(2)}
                        leftIcon={<ArrowLeft className="w-4 h-4" />}
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={submitting}
                      rightIcon={<Send className="w-4 h-4" />}
                      className={participantTypes.length > 0 ? 'w-2/3' : 'w-full'}
                    >
                      Submit Registration
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
}
