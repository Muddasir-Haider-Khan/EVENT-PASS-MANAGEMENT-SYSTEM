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
        if (data.payment) {
          setPayment({
            accountNumber: data.payment.accountNumber || payment.accountNumber,
            paymentPhone: data.payment.paymentPhone || payment.paymentPhone,
          });
        }
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mx-auto">
            <Ticket className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Event Registration Unavailable</h1>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            This event pass registration link is either invalid, inactive, or has closed.
          </p>
        </div>
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
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 antialiased font-sans">
          <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-200 shadow-2xl space-y-6">
            {event.logoUrl ? (
              <img
                src={event.logoUrl}
                alt={event.name}
                className="w-24 h-24 rounded-3xl object-cover mx-auto border-2 border-slate-100 shadow-xl ring-4 ring-slate-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
                <Ticket className="w-8 h-8" />
              </div>
            )}

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 border border-emerald-200 text-emerald-800 uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> Registration Submitted
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 mb-2">
                Registration Received!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Your application for <strong className="text-slate-900 font-bold">{event.name}</strong> has been successfully submitted.
                Your official pass and entry QR code will be generated upon approval.
              </p>
            </div>

            {(payment.accountNumber || payment.paymentPhone) && (
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    💳
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Payment & Fee Deposit Details
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Please transfer registration fee to the details below and submit proof.
                    </p>
                  </div>
                </div>

                {payment.accountNumber && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Account / IBAN Number
                    </span>
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 select-all">
                        {payment.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(payment.accountNumber || '');
                          setCopiedAcc(true);
                          setTimeout(() => setCopiedAcc(false), 2000);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 shrink-0 ml-2 cursor-pointer"
                      >
                        {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAcc ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {payment.paymentPhone && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Payment Verification Phone / WhatsApp
                    </span>
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 select-all">
                        {payment.paymentPhone}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(payment.paymentPhone || '');
                            setCopiedPhone(true);
                            setTimeout(() => setCopiedPhone(false), 2000);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={`https://wa.me/${payment.paymentPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 rounded-lg border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 antialiased font-sans relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

        <div className="max-w-xl w-full space-y-6 relative z-10">
          {/* White-labeled Event Branding Header */}
          <div className="text-center space-y-3.5">
            {event.logoUrl ? (
              <div className="relative inline-block">
                <img
                  src={event.logoUrl}
                  alt={event.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover mx-auto border-4 border-white shadow-2xl shadow-slate-300/60 ring-1 ring-slate-200 bg-white"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-xl mx-auto">
                <Ticket className="w-10 h-10" />
              </div>
            )}

            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-200/80 text-slate-800 uppercase tracking-widest border border-slate-300/60 shadow-sm">
                Official Event Registration
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
              {event.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-slate-800">
                <MapPin className="w-4 h-4 text-slate-900" />
                <span>{event.venue}</span>
              </span>
              {event.eventDate && (
                <span className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-slate-800">
                  <Calendar className="w-4 h-4 text-slate-900" />
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
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed font-medium">
                {event.description}
              </p>
            )}
          </div>

          {/* Clean White Registration Form Card */}
          <div className="bg-white border border-slate-200 shadow-2xl shadow-slate-300/50 rounded-3xl p-6 sm:p-10">
            {/* Step Wizard Indicator */}
            {(isMun || participantTypes.length > 0) && (
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  <span className="text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-extrabold">
                    Step {step} of 3
                  </span>
                  <span className="text-slate-600 font-semibold">
                    {step === 1 && 'Select Category'}
                    {step === 2 && (selectedCategory?.isGroup ? 'Delegation Members' : 'Personal Details')}
                    {step === 3 && 'Event Questionnaire'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-slate-900 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: Select Category */}
              {participantTypes.length > 0 && step === 1 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-900" />
                      Select Registration Category
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Choose your participant type to continue registration.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {participantTypes.map((type) => {
                      const isSelected = selectedTypeId === type.id;
                      return (
                        <div
                          key={type.id}
                          onClick={() => setSelectedTypeId(type.id)}
                          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/15'
                              : 'bg-slate-50/50 border-slate-200 text-slate-900 hover:bg-slate-100/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-extrabold text-sm flex items-center gap-2">
                              {type.name}
                            </span>
                            <div className="flex items-center gap-2">
                              {type.isGroup ? (
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                  isSelected ? 'bg-white/20 text-white border border-white/30' : 'bg-purple-100 border border-purple-200 text-purple-800'
                                }`}>
                                  <Users className="w-3 h-3" /> Group ({type.groupSize || 4} Members)
                                </span>
                              ) : (
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  Single Participant
                                </span>
                              )}
                              {isSelected && (
                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                              )}
                            </div>
                          </div>
                          {type.description && (
                            <p className={`text-xs mt-1.5 font-medium ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                              {type.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={!selectedTypeId}
                    onClick={() => {
                      setError('');
                      setStep(2);
                    }}
                    className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-slate-900/15 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    <span>Next: Enter Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Participant Details (Single vs Group Delegation) */}
              {step === 2 && (
                <div className="space-y-5">
                  {selectedCategory?.isGroup ? (
                    // GROUP DELEGATION REGISTRATION FORM
                    <div className="space-y-4">
                      <div className="border-b border-slate-200 pb-3">
                        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-600" />
                          Group Delegation Registration ({selectedCategory.groupSize || 4} Members)
                        </h2>
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          Please enter your delegation group name and details for all {selectedCategory.groupSize || 4} members.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                          Delegation / Group Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          required
                          placeholder="e.g. Alpha Delegation / Team Vanguard"
                          className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3.5 outline-none font-medium transition-all"
                        />
                      </div>

                      {/* Member Tab Navigation */}
                      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200">
                        {groupMembers.map((m, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveMemberTab(idx)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                              activeMemberTab === idx
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                            }`}
                          >
                            <span>Member #{idx + 1}</span>
                            {m.isLeader && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-300 text-amber-950 font-black">
                                Leader
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Active Member Form Inputs */}
                      {groupMembers[activeMemberTab] && (
                        <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              Member #{activeMemberTab + 1} Profile
                            </span>
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-800 font-bold">
                              <input
                                type="radio"
                                name="groupLeaderSelection"
                                checked={groupMembers[activeMemberTab].isLeader}
                                onChange={() => updateGroupMember(activeMemberTab, 'isLeader', true)}
                                className="w-3.5 h-3.5 accent-amber-600 cursor-pointer"
                              />
                              <span>Designate as Group Leader</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-900 mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={groupMembers[activeMemberTab].name}
                              onChange={(e) => updateGroupMember(activeMemberTab, 'name', e.target.value)}
                              required
                              placeholder="Member full name"
                              className="w-full bg-white border border-slate-300 text-xs text-slate-900 font-medium rounded-xl px-3.5 py-3 outline-none focus:border-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-900 mb-1">
                              Email Address (Pass will be sent here) *
                            </label>
                            <input
                              type="email"
                              value={groupMembers[activeMemberTab].email}
                              onChange={(e) => updateGroupMember(activeMemberTab, 'email', e.target.value)}
                              required
                              placeholder="member.email@example.com"
                              className="w-full bg-white border border-slate-300 text-xs text-slate-900 font-medium rounded-xl px-3.5 py-3 outline-none focus:border-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-900 mb-1">
                              Phone / WhatsApp *
                            </label>
                            <input
                              type="tel"
                              value={groupMembers[activeMemberTab].phone}
                              onChange={(e) => updateGroupMember(activeMemberTab, 'phone', e.target.value)}
                              required
                              placeholder="+92 300 1234567"
                              className="w-full bg-white border border-slate-300 text-xs text-slate-900 font-medium rounded-xl px-3.5 py-3 outline-none focus:border-slate-900"
                            />
                          </div>

                          <ImageUpload
                            label={`Member #${activeMemberTab + 1} Security Photo *`}
                            value={groupMembers[activeMemberTab].photoUrl}
                            onChange={(url) => updateGroupMember(activeMemberTab, 'photoUrl', url)}
                            folder={`/epms/group-${slug}/photos`}
                            helpText="Member face photo for gate entry verification."
                            theme="light"
                          />
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          className="w-1/2 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          onClick={() => setStep(1)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back: Categories</span>
                        </button>
                        <button
                          type="button"
                          className="w-1/2 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl shadow-slate-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          onClick={() => {
                            setError('');
                            setStep(3);
                          }}
                        >
                          <span>Next: Questionnaire</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // SINGLE PARTICIPANT REGISTRATION FORM
                    <div className="space-y-4">
                      <div className="border-b border-slate-200 pb-3">
                        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-slate-900" />
                          Contact & Security Details
                        </h2>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          placeholder="e.g. John Doe"
                          className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3.5 outline-none font-medium transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="your.email@example.com"
                          className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3.5 outline-none font-medium transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                          Phone / WhatsApp Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          placeholder="e.g. +92 300 1234567"
                          className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3.5 outline-none font-medium transition-all"
                        />
                      </div>

                      <ImageUpload
                        label="Participant Face Photo *"
                        value={photoUrl}
                        onChange={(url) => setPhotoUrl(url)}
                        folder={`/epms/mun-${slug}/photos`}
                        helpText="Your photo will be displayed to gate security personnel upon QR scan."
                        theme="light"
                      />

                      <div className="flex gap-3 pt-2">
                        {participantTypes.length > 0 && (
                          <button
                            type="button"
                            className="w-1/2 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            onClick={() => setStep(1)}
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back: Categories</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!email || !fullName || !phone}
                          className={`${participantTypes.length > 0 ? 'w-1/2' : 'w-full'} py-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-slate-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer`}
                          onClick={() => {
                            setError('');
                            setStep(3);
                          }}
                        >
                          <span>Next: Questionnaire</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Event Questionnaire & Submit */}
              {(step === 3 || (participantTypes.length === 0 && !isMun)) && (
                <div className="space-y-5">
                  <div className="border-b border-slate-200 pb-3 mb-2">
                    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-900" />
                      Event Questionnaire Answers
                    </h2>
                  </div>

                  {activeFields.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 text-center">
                      No additional custom questionnaire fields for this category. Ready to submit!
                    </div>
                  ) : (
                    activeFields.map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>

                        {field.type === 'SHORT_TEXT' ? (
                          <input
                            type="text"
                            value={(responses[field.id] as string) || ''}
                            onChange={(e) => updateResponse(field.id, e.target.value)}
                            required={field.required}
                            placeholder={`Enter ${(field.label || '').toLowerCase()}...`}
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3.5 outline-none font-medium transition-all"
                          />
                        ) : field.type === 'PARAGRAPH' ? (
                          <textarea
                            rows={3}
                            value={(responses[field.id] as string) || ''}
                            onChange={(e) => updateResponse(field.id, e.target.value)}
                            required={field.required}
                            placeholder={`Enter ${(field.label || '').toLowerCase()}...`}
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-900 placeholder-slate-400 rounded-xl p-4 outline-none resize-y font-medium transition-all"
                          />
                        ) : field.type === 'NUMBER' ? (
                          <input
                            type="number"
                            value={(responses[field.id] as string) || ''}
                            onChange={(e) => updateResponse(field.id, e.target.value)}
                            required={field.required}
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3.5 outline-none font-medium transition-all"
                          />
                        ) : field.type === 'DATE' ? (
                          <input
                            type="date"
                            value={(responses[field.id] as string) || ''}
                            onChange={(e) => updateResponse(field.id, e.target.value)}
                            required={field.required}
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3.5 outline-none font-medium transition-all"
                          />
                        ) : field.type === 'DROPDOWN' ? (
                          <select
                            value={(responses[field.id] as string) || ''}
                            onChange={(e) => updateResponse(field.id, e.target.value)}
                            required={field.required}
                            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 text-sm text-slate-900 rounded-xl px-4 py-3.5 outline-none font-medium transition-all"
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
                              <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-sm font-semibold text-slate-900 cursor-pointer transition-all">
                                <input
                                  type="radio"
                                  name={field.id}
                                  value={opt}
                                  checked={responses[field.id] === opt}
                                  onChange={() => updateResponse(field.id, opt)}
                                  required={field.required}
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : field.type === 'CHECKBOX' ? (
                          <div className="space-y-2 pt-1">
                            {(field.options || []).map((opt, i) => (
                              <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-sm font-semibold text-slate-900 cursor-pointer transition-all">
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
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
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
                    <div className="flex items-center gap-2 p-3.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    {participantTypes.length > 0 && (
                      <button
                        type="button"
                        className="w-1/3 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        onClick={() => setStep(2)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`${participantTypes.length > 0 ? 'w-2/3' : 'w-full'} py-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-slate-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer`}
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Registration</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
