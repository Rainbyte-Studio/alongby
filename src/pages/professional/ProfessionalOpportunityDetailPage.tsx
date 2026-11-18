import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { opportunityService } from '../../services/opportunityService';
import { quoteService } from '../../services/quoteService';
import {
  Opportunity,
  Quote,
  QuoteType,
  PassReason,
} from '../../types';
import {
  ArrowLeft,
  Calendar,
  Euro,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Send,
  HelpCircle,
} from 'lucide-react';

export const ProfessionalOpportunityDetailPage: React.FC = () => {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [existingQuote, setExistingQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Proposal mode: 'quote' | 'alternative' | 'pass'
  const [actionTab, setActionTab] = useState<'quote' | 'alternative' | 'pass'>('quote');

  // Form State
  const [amountEuros, setAmountEuros] = useState<string>('');
  const [proposedStartDate, setProposedStartDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState<number>(30);
  const [revisionsIncluded, setRevisionsIncluded] = useState<number>(2);
  const [scopeSummary, setScopeSummary] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [alternativeExplanation, setAlternativeExplanation] = useState<string>('');

  // Included and excluded line items
  const [includedItems, setIncludedItems] = useState<string[]>([
    'End-to-end UX/UI implementation',
    'Responsive design across mobile, tablet, and desktop',
    'Code delivery with comprehensive documentation',
    'Initial QA and launch deployment assistance',
  ]);
  const [newIncludedItem, setNewIncludedItem] = useState('');

  const [excludedItems, setExcludedItems] = useState<string[]>([
    'Ongoing third-party API or hosting subscriptions',
    'Copywriting / translation services',
  ]);
  const [newExcludedItem, setNewExcludedItem] = useState('');

  // Pass Reason State
  const [passReason, setPassReason] = useState<PassReason>('not_available');
  const [passNote, setPassNote] = useState<string>('');

  const loadOpportunity = async () => {
    if (!opportunityId || !currentUser) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const opp = await opportunityService.getOpportunity(opportunityId, currentUser.uid);
      if (!opp) {
        setErrorMsg('Opportunity not found or unauthorized.');
        return;
      }
      setOpportunity(opp);

      // Auto-mark viewed if pending
      if (opp.status === 'pending') {
        await opportunityService.markOpportunityViewed(opportunityId, currentUser.uid);
      }

      // If already responded with quote or alternative proposal, load the quote
      if (opp.status === 'interested' || opp.status === 'alternative_proposal' || opp.quoteId) {
        if (opp.quoteId) {
          try {
            const directQuote = await quoteService.getQuote(opp.quoteId, currentUser.uid);
            if (directQuote) {
              setExistingQuote(directQuote);
            } else {
              const oppQuote = await quoteService.getQuoteForOpportunity(opp.id, currentUser.uid);
              setExistingQuote(oppQuote);
            }
          } catch {
            const oppQuote = await quoteService.getQuoteForOpportunity(opp.id, currentUser.uid);
            setExistingQuote(oppQuote);
          }
        } else {
          const q = await quoteService.getQuoteForOpportunity(opp.id, currentUser.uid);
          setExistingQuote(q);
        }
      }
    } catch (err: any) {
      console.error('Failed to load opportunity:', err);
      setErrorMsg(err.message || 'Failed to load opportunity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunity();
  }, [opportunityId, currentUser]);

  const handleAddIncluded = () => {
    if (newIncludedItem.trim()) {
      setIncludedItems([...includedItems, newIncludedItem.trim()]);
      setNewIncludedItem('');
    }
  };

  const handleRemoveIncluded = (index: number) => {
    setIncludedItems(includedItems.filter((_, i) => i !== index));
  };

  const handleAddExcluded = () => {
    if (newExcludedItem.trim()) {
      setExcludedItems([...excludedItems, newExcludedItem.trim()]);
      setNewExcludedItem('');
    }
  };

  const handleRemoveExcluded = (index: number) => {
    setExcludedItems(excludedItems.filter((_, i) => i !== index));
  };

  // Submit Standard Quote or Alternative Proposal
  const handleSubmitProposal = async (type: QuoteType) => {
    if (!opportunity || !currentUser) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const parsedEuros = parseFloat(amountEuros);
      if (isNaN(parsedEuros) || parsedEuros <= 0) {
        setErrorMsg('Please enter a valid commercial amount in Euros.');
        setSubmitting(false);
        return;
      }

      const amountMinor = Math.round(parsedEuros * 100);

      await quoteService.submitQuote(
        {
          opportunityId: opportunity.id,
          quoteType: type,
          amountMinor,
          scopeSummary,
          includedItems,
          excludedItems,
          proposedStartDate,
          estimatedDurationDays: durationDays,
          revisionsIncluded,
          note,
          alternativeExplanation: type === 'alternative' ? alternativeExplanation : undefined,
        },
        currentUser.uid
      );

      setSuccessMsg(
        type === 'standard'
          ? 'Your commercial quote has been submitted successfully to Alongby curation.'
          : 'Your alternative proposal has been submitted successfully to Alongby curation.'
      );

      await loadOpportunity();
    } catch (err: any) {
      console.error('Error submitting proposal:', err);
      setErrorMsg(err.message || 'Failed to submit proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pass on opportunity
  const handlePass = async () => {
    if (!opportunity || !currentUser) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await opportunityService.passOpportunity(
        opportunity.id,
        currentUser.uid,
        passReason,
        passNote
      );

      setSuccessMsg('You have passed on this opportunity. Your response has been recorded.');
      await loadOpportunity();
    } catch (err: any) {
      console.error('Error passing on opportunity:', err);
      setErrorMsg(err.message || 'Failed to pass on opportunity.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Opportunity Specifications">
        <div className="py-24 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-xs text-neutral-500">Loading project brief specifications…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (errorMsg && !opportunity) {
    return (
      <DashboardLayout title="Project Opportunity">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-neutral-900">{errorMsg}</h2>
          <Button variant="outline" onClick={() => navigate('/professional/opportunities')}>
            Back to Opportunities
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!opportunity) return null;

  const snap = opportunity.projectSnapshot;
  const isActionable =
    (opportunity.status === 'pending' || opportunity.status === 'viewed') &&
    new Date(opportunity.expiresAt) >= new Date();
  const isExpired = opportunity.status === 'expired' || new Date(opportunity.expiresAt) < new Date();

  // Real-time budget feedback
  const parsedEuros = parseFloat(amountEuros) || 0;
  const quoteMinor = Math.round(parsedEuros * 100);
  const maxIndicative = snap.indicativeBudget?.maxAmountMinor || 0;
  const budgetRelation =
    quoteMinor > 0 && maxIndicative > 0
      ? quoteMinor <= maxIndicative
        ? 'within'
        : quoteMinor <= maxIndicative * 1.25
        ? 'slightly_above'
        : 'materially_above'
      : null;

  return (
    <DashboardLayout
      title={snap.title}
      subtitle={`Private Opportunity • ${snap.serviceName} (${snap.projectTypeName}) • Expires ${new Date(opportunity.expiresAt).toLocaleDateString()}`}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/professional/opportunities')}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          All Opportunities
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Alerts */}
        {successMsg && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="font-bold text-emerald-700">
              ×
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="font-bold text-rose-700">
              ×
            </button>
          </div>
        )}

        {/* Status Notice Banner if Selected */}
        {(existingQuote?.status === 'selected' || opportunity.status === 'selected') && (
          <div className="p-5 rounded-xl bg-emerald-900 text-white border border-emerald-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Congratulations • You Were Selected!
                </span>
              </div>
              <h2 className="text-base font-serif font-bold text-white">
                Client Selected Your Proposal for Commercial Agreement
              </h2>
              <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                The client chose your quote. Review the formal Proposal v1 (deliverables, milestones, 50/50 escrow terms) and proceed to electronic contract execution.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Link to={`/professional/projects/${opportunity.projectId}/proposal`}>
                <Button variant="primary" size="sm" className="bg-white text-emerald-950 hover:bg-emerald-50 font-medium">
                  Review Proposal v1
                </Button>
              </Link>
              <Link to={`/professional/projects/${opportunity.projectId}/contract`}>
                <Button variant="outline" size="sm" className="bg-transparent text-white border-white/40 hover:bg-white/10">
                  Master Contract
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Status Notice Banner if Already Responded */}
        {opportunity.status === 'interested' && existingQuote && existingQuote.status !== 'selected' && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block font-semibold">Standard Quote Submitted & Locked</strong>
              <span>
                You submitted a commercial quote of €{(existingQuote.amountMinor / 100).toLocaleString()}{' '}
                on {new Date(existingQuote.submittedAt).toLocaleDateString()}. Alongby curators are reviewing
                proposals before shortlisting.
              </span>
            </div>
          </div>
        )}

        {opportunity.status === 'alternative_proposal' && existingQuote && (
          <div className="p-4 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <strong className="block font-semibold">Alternative Proposal Submitted</strong>
              <span>
                You submitted an alternative proposal of €{(existingQuote.amountMinor / 100).toLocaleString()}{' '}
                with custom delivery scope on {new Date(existingQuote.submittedAt).toLocaleDateString()}.
              </span>
            </div>
          </div>
        )}

        {opportunity.status === 'passed' && (
          <div className="p-4 rounded-lg bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-neutral-400 shrink-0" />
            <div>
              <strong className="block font-semibold">Opportunity Passed</strong>
              <span>
                You declined to quote on this project ({opportunity.passReason?.replace(/_/g, ' ')}).
              </span>
            </div>
          </div>
        )}

        {isExpired && opportunity.status === 'expired' && (
          <div className="p-4 rounded-lg bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 flex items-center gap-3">
            <Clock className="w-5 h-5 text-neutral-400 shrink-0" />
            <div>
              <strong className="block font-semibold">Opportunity Expired</strong>
              <span>
                The response window for this opportunity closed on{' '}
                {new Date(opportunity.expiresAt).toLocaleDateString()}.
              </span>
            </div>
          </div>
        )}

        {/* 2-Column Layout: Project Specifications on Left, Quote/Action on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Project Specifications */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Project Brief Specification
                </span>
                <h2 className="text-xl font-bold text-neutral-900 font-serif">{snap.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-medium">
                    {snap.serviceName}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    • {snap.projectTypeName}
                  </span>
                  {snap.industryName && (
                    <span className="text-xs text-neutral-400 font-medium">
                      • {snap.industryName}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  Project Overview
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">
                  {snap.description}
                </p>
              </div>

              {/* Goals */}
              {snap.goals && snap.goals.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                    Primary Goals
                  </h4>
                  <ul className="list-disc list-inside text-xs text-neutral-600 space-y-1">
                    {snap.goals.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Features Required */}
              {snap.features && snap.features.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                    Required Features & Deliverables
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {snap.features.map((f, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 font-medium"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Assets */}
              {snap.existingAssets && snap.existingAssets.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                    Client's Existing Assets
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {snap.existingAssets.map((asset, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-neutral-600"
                      >
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Indicative Budget & Timeline */}
              <div className="pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-neutral-50">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                    <Euro className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Indicative Client Budget</span>
                  </div>
                  <div className="text-sm font-bold text-neutral-900">
                    {snap.indicativeBudget?.budgetType === 'unsure' ? (
                      'Open / Unspecified'
                    ) : (
                      `€${((snap.indicativeBudget?.minAmountMinor || 0) / 100).toLocaleString()} – €${((snap.indicativeBudget?.maxAmountMinor || 0) / 100).toLocaleString()} ${snap.indicativeBudget?.currency || 'EUR'}`
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Guidance only; quote your real baseline
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-neutral-50">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Target Timeline</span>
                  </div>
                  <div className="text-sm font-bold text-neutral-900">
                    Start: {snap.timeline?.preferredStart.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Flexibility: {snap.timeline?.flexibility.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {snap.attachments && snap.attachments.length > 0 && (
                <div className="pt-4 border-t border-neutral-100">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                    Project Brief Attachments ({snap.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {snap.attachments.map((att) => (
                      <div
                        key={att.fileId}
                        className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-white text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-neutral-400" />
                          <span className="font-medium text-neutral-800">{att.name}</span>
                          <span className="text-neutral-400">
                            ({Math.round(att.size / 1024)} KB)
                          </span>
                        </div>
                        {att.downloadUrl ? (
                          <a
                            href={att.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-neutral-900 hover:underline"
                          >
                            View File
                          </a>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">Safe storage</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Why You Were Matched */}
              {opportunity.matchReasons && opportunity.matchReasons.length > 0 && (
                <div className="p-4 rounded-lg bg-neutral-900 text-white space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Why Alongby Matched You for This Project</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {opportunity.matchReasons.map((reason, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-200 font-medium"
                      >
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Commercial Response Form or Submitted Quote */}
          <div className="lg:col-span-5 space-y-6">
            {isActionable ? (
              <Card className="p-6 space-y-5 border-neutral-300 shadow-xs">
                {/* Mode Selector */}
                <div className="flex items-center p-1 bg-neutral-100 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setActionTab('quote')}
                    className={`flex-1 py-1.5 rounded-md transition-colors ${
                      actionTab === 'quote'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Standard Quote
                  </button>
                  <button
                    onClick={() => setActionTab('alternative')}
                    className={`flex-1 py-1.5 rounded-md transition-colors ${
                      actionTab === 'alternative'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Alternative Scope
                  </button>
                  <button
                    onClick={() => setActionTab('pass')}
                    className={`flex-1 py-1.5 rounded-md transition-colors ${
                      actionTab === 'pass'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Pass
                  </button>
                </div>

                {/* MODE A: STANDARD QUOTE */}
                {actionTab === 'quote' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 font-serif">
                        Submit Commercial Quote
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Propose fixed pricing and delivery terms matching client requirements.
                      </p>
                    </div>

                    {/* Price Input */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Total Commercial Amount (€ EUR) *
                      </label>
                      <div className="relative">
                        <Euro className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                        <input
                          type="number"
                          placeholder="e.g. 2500"
                          value={amountEuros}
                          onChange={(e) => setAmountEuros(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>

                      {/* Real-time budget feedback indicator */}
                      {budgetRelation && (
                        <div className="mt-1.5 text-[11px] font-medium">
                          {budgetRelation === 'within' && (
                            <span className="text-emerald-700">✓ Within client indicative range</span>
                          )}
                          {budgetRelation === 'slightly_above' && (
                            <span className="text-amber-700">
                              ℹ Slightly above client max (€{(maxIndicative / 100).toLocaleString()})
                            </span>
                          )}
                          {budgetRelation === 'materially_above' && (
                            <span className="text-neutral-600">
                              ℹ Materially above client max; consider an alternative proposal if appropriate
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Kick-off Date *
                        </label>
                        <input
                          type="date"
                          value={proposedStartDate}
                          onChange={(e) => setProposedStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Duration (Days) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={durationDays}
                          onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Revisions Included *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={revisionsIncluded}
                        onChange={(e) => setRevisionsIncluded(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>

                    {/* Scope Delivery Summary */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Scope Delivery Summary *
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Detail the technical approach, milestones, and deliverables included in this quote..."
                        value={scopeSummary}
                        onChange={(e) => setScopeSummary(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    {/* Inclusions */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Included Deliverables
                      </label>
                      <div className="space-y-1.5 mb-2">
                        {includedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs p-2 rounded bg-neutral-50 text-neutral-700"
                          >
                            <span>• {item}</span>
                            <button
                              onClick={() => handleRemoveIncluded(idx)}
                              className="text-neutral-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add inclusion (e.g. Design handoff)"
                          value={newIncludedItem}
                          onChange={(e) => setNewIncludedItem(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIncluded())}
                          className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg"
                        />
                        <Button variant="outline" size="sm" onClick={handleAddIncluded}>
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Exclusions */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Exclusions (Out of Scope)
                      </label>
                      <div className="space-y-1.5 mb-2">
                        {excludedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs p-2 rounded bg-neutral-50 text-neutral-700"
                          >
                            <span>✕ {item}</span>
                            <button
                              onClick={() => handleRemoveExcluded(idx)}
                              className="text-neutral-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add exclusion (e.g. Hosting fees)"
                          value={newExcludedItem}
                          onChange={(e) => setNewExcludedItem(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExcluded())}
                          className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg"
                        />
                        <Button variant="outline" size="sm" onClick={handleAddExcluded}>
                          Add
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full mt-2"
                      isLoading={submitting}
                      onClick={() => handleSubmitProposal('standard')}
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      Submit Commercial Quote
                    </Button>
                  </div>
                )}

                {/* MODE B: ALTERNATIVE PROPOSAL */}
                {actionTab === 'alternative' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 font-serif">
                        Submit Alternative Proposal
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Recommend a modified scope, phased delivery, or different architecture.
                      </p>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Alternative Proposal Justification *
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Explain to the client why an alternative scope or phased approach is recommended for best results..."
                        value={alternativeExplanation}
                        onChange={(e) => setAlternativeExplanation(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    {/* Price Input */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Proposed Price (€ EUR) *
                      </label>
                      <div className="relative">
                        <Euro className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                        <input
                          type="number"
                          placeholder="e.g. 3200"
                          value={amountEuros}
                          onChange={(e) => setAmountEuros(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Kick-off Date *
                        </label>
                        <input
                          type="date"
                          value={proposedStartDate}
                          onChange={(e) => setProposedStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Duration (Days) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={durationDays}
                          onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                    </div>

                    {/* Scope Delivery Summary */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Alternative Scope Deliverables *
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Detail what is delivered in this alternative proposal..."
                        value={scopeSummary}
                        onChange={(e) => setScopeSummary(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <Button
                      variant="primary"
                      className="w-full mt-2"
                      isLoading={submitting}
                      onClick={() => handleSubmitProposal('alternative')}
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Submit Alternative Proposal
                    </Button>
                  </div>
                )}

                {/* MODE C: PASS ON OPPORTUNITY */}
                {actionTab === 'pass' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 font-serif">
                        Pass on Opportunity
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Let us know why you cannot accept this brief. This maintains your marketplace reliability standing.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Reason for passing *
                      </label>
                      <select
                        value={passReason}
                        onChange={(e) => setPassReason(e.target.value as PassReason)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
                      >
                        <option value="not_available">I am currently fully booked / no capacity</option>
                        <option value="budget_too_low">Client budget is below my engagement floor</option>
                        <option value="scope_not_fit">Project scope does not fit my preferred work</option>
                        <option value="timeline_not_fit">Client timeline is too tight</option>
                        <option value="outside_expertise">Technical requirements outside my stack</option>
                        <option value="other">Other reason</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Private Note to Alongby Curators (Optional)
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Share any additional context or when you might be open for similar briefs..."
                        value={passNote}
                        onChange={(e) => setPassNote(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full text-rose-700 border-rose-200 hover:bg-rose-50"
                      isLoading={submitting}
                      onClick={handlePass}
                      leftIcon={<XCircle className="w-4 h-4 text-rose-600" />}
                    >
                      Confirm: Pass on this Opportunity
                    </Button>
                  </div>
                )}
              </Card>
            ) : existingQuote ? (
              /* READ-ONLY SUBMITTED QUOTE CARD */
              <Card className="p-6 space-y-4 bg-neutral-50 border-neutral-200">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <h3 className="text-sm font-bold text-neutral-900 font-serif">
                    {existingQuote.quoteType === 'alternative'
                      ? 'Alternative Proposal Submitted'
                      : 'Commercial Quote Submitted'}
                  </h3>
                  <Badge variant="success">Locked (v1)</Badge>
                </div>

                <div className="p-4 rounded-lg bg-white border border-neutral-200">
                  <span className="text-xs text-neutral-500 block">Proposed Amount</span>
                  <span className="text-2xl font-serif font-bold text-neutral-900">
                    €{(existingQuote.amountMinor / 100).toLocaleString()} {existingQuote.currency}
                  </span>
                </div>

                {existingQuote.alternativeExplanation && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong className="block mb-1">Proposal Justification:</strong>
                    <p>{existingQuote.alternativeExplanation}</p>
                  </div>
                )}

                <div>
                  <span className="text-xs font-bold text-neutral-700 block mb-1">Scope Summary</span>
                  <p className="text-xs text-neutral-600 bg-white p-3 rounded-md border border-neutral-200 leading-relaxed whitespace-pre-wrap">
                    {existingQuote.scopeSummary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-400 block">Proposed Kick-off</span>
                    <span className="font-semibold text-neutral-800">{existingQuote.proposedStartDate}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Duration</span>
                    <span className="font-semibold text-neutral-800">{existingQuote.estimatedDurationDays} days</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Revisions</span>
                    <span className="font-semibold text-neutral-800">{existingQuote.revisionsIncluded} included</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Status</span>
                    <span className="font-semibold text-neutral-800 uppercase">{existingQuote.status}</span>
                  </div>
                </div>

                {existingQuote.includedItems && existingQuote.includedItems.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-neutral-700 block mb-1">Inclusions</span>
                    <ul className="list-disc list-inside text-xs text-neutral-600 space-y-0.5">
                      {existingQuote.includedItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {existingQuote.excludedItems && existingQuote.excludedItems.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-neutral-700 block mb-1">Exclusions</span>
                    <ul className="list-disc list-inside text-xs text-neutral-600 space-y-0.5">
                      {existingQuote.excludedItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
