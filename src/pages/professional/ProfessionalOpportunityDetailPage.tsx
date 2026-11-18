import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
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
          <p className="mt-4 text-xs text-[var(--color-text-secondary)]">Loading project brief specifications…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (errorMsg && !opportunity) {
    return (
      <DashboardLayout title="Project Opportunity">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[var(--color-error-text)] mx-auto" />
          <h2 className="typo-card-title text-[var(--color-text-primary)]">{errorMsg}</h2>
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
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-xs text-[var(--color-success-text)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              aria-label="Dismiss success message"
              className="font-semibold px-1.5 py-0.5 rounded hover:bg-black/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              ×
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-xs text-[var(--color-error-text)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              aria-label="Dismiss error message"
              className="font-semibold px-1.5 py-0.5 rounded hover:bg-black/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              ×
            </button>
          </div>
        )}

        {/* Status Notice Banner if Selected */}
        {(existingQuote?.status === 'selected' || opportunity.status === 'selected') && (
          <div className="p-5 sm:p-6 rounded-[var(--radius-card)] bg-[var(--color-primary)] text-[var(--color-primary-text)] border border-[var(--color-primary)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[#A7F3D0]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Proposal Selected
                </span>
              </div>
              <h2 className="typo-section-heading text-white">
                Client Selected Your Proposal for Commercial Agreement
              </h2>
              <p className="text-[13px] text-[#D6D3CD] max-w-2xl leading-relaxed">
                The client chose your quote. Review the formal Proposal v1 (deliverables, milestones, 50/50 staged payment terms) and proceed to electronic contract execution.
              </p>
            </div>

            <div className="shrink-0 flex flex-wrap items-center gap-2">
              <Link to={`/professional/projects/${opportunity.projectId}/proposal`}>
                <Button variant="white" size="sm">
                  Review Proposal v1
                </Button>
              </Link>
              <Link to={`/professional/projects/${opportunity.projectId}/contract`}>
                <Button variant="outline" size="sm" className="bg-transparent text-white border-white/35 hover:bg-white/10">
                  Master Contract
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Status Notice Banner if Already Responded */}
        {opportunity.status === 'interested' && existingQuote && existingQuote.status !== 'selected' && (
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-xs text-[var(--color-success-text)] flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <strong className="block font-semibold">Standard Quote Submitted & Locked</strong>
              <span>
                You submitted a commercial quote of{' '}
                <span className="font-semibold tabular-nums">
                  €{(existingQuote.amountMinor / 100).toLocaleString()}
                </span>{' '}
                on{' '}
                <span className="tabular-nums">
                  {new Date(existingQuote.submittedAt).toLocaleDateString()}
                </span>
                . Alongby curators are reviewing proposals before shortlisting.
              </span>
            </div>
          </div>
        )}

        {opportunity.status === 'alternative_proposal' && existingQuote && (
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-info-bg)] border border-[var(--color-info-border)] text-xs text-[var(--color-info-text)] flex items-center gap-3">
            <Sparkles className="w-5 h-5 shrink-0" />
            <div>
              <strong className="block font-semibold">Alternative Proposal Submitted</strong>
              <span>
                You submitted an alternative proposal of{' '}
                <span className="font-semibold tabular-nums">
                  €{(existingQuote.amountMinor / 100).toLocaleString()}
                </span>{' '}
                with custom delivery scope on{' '}
                <span className="tabular-nums">
                  {new Date(existingQuote.submittedAt).toLocaleDateString()}
                </span>
                .
              </span>
            </div>
          </div>
        )}

        {opportunity.status === 'passed' && (
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-center gap-3">
            <XCircle className="w-5 h-5 shrink-0 text-[var(--color-text-muted)]" />
            <div>
              <strong className="block font-semibold text-[var(--color-text-primary)]">Opportunity Passed</strong>
              <span>
                You declined to quote on this project ({opportunity.passReason?.replace(/_/g, ' ')}).
              </span>
            </div>
          </div>
        )}

        {isExpired && opportunity.status === 'expired' && (
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-center gap-3">
            <Clock className="w-5 h-5 shrink-0 text-[var(--color-text-muted)]" />
            <div>
              <strong className="block font-semibold text-[var(--color-text-primary)]">Opportunity Expired</strong>
              <span>
                The response window for this opportunity closed on{' '}
                <span className="tabular-nums">
                  {new Date(opportunity.expiresAt).toLocaleDateString()}
                </span>
                .
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
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                  Project Brief Specification
                </span>
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">{snap.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {snap.serviceName}
                  </span>
                  <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                    {snap.projectTypeName}
                  </span>
                  {snap.industryName && (
                    <>
                      <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                      <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                        {snap.industryName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
                  Project Overview
                </h4>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap break-words">
                  {snap.description}
                </p>
              </div>

              {/* Goals */}
              {snap.goals && snap.goals.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
                    Primary Goals
                  </h4>
                  <ul className="list-disc list-inside text-sm text-[var(--color-text-secondary)] space-y-1.5 leading-relaxed">
                    {snap.goals.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Features Required */}
              {snap.features && snap.features.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
                    Required Features & Deliverables
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {snap.features.map((f, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-medium"
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
                  <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
                    Client's Existing Assets
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {snap.existingAssets.map((asset, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      >
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Indicative Budget & Timeline */}
              <div className="pt-4 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <span>Indicative Client Budget</span>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-[var(--color-text-primary)] break-words">
                    {snap.indicativeBudget?.budgetType === 'unsure' ? (
                      'Open / Unspecified'
                    ) : (
                      `€${((snap.indicativeBudget?.minAmountMinor || 0) / 100).toLocaleString()} – €${((snap.indicativeBudget?.maxAmountMinor || 0) / 100).toLocaleString()} ${snap.indicativeBudget?.currency || 'EUR'}`
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Guidance only; quote your real baseline
                  </div>
                </div>

                <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <span>Target Timeline</span>
                  </div>
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">
                    Start: {snap.timeline?.preferredStart.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Flexibility: {snap.timeline?.flexibility.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {snap.attachments && snap.attachments.length > 0 && (
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-2 tabular-nums">
                    Project Brief Attachments ({snap.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {snap.attachments.map((att) => (
                      <div
                        key={att.fileId}
                        className="flex items-center justify-between p-3 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                          <span className="font-medium text-[var(--color-text-primary)] break-words">{att.name}</span>
                          <span className="text-[var(--color-text-secondary)] tabular-nums shrink-0">
                            ({Math.round(att.size / 1024)} KB)
                          </span>
                        </div>
                        {att.downloadUrl ? (
                          <a
                            href={att.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline shrink-0 ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm"
                          >
                            View File
                          </a>
                        ) : (
                          <span className="text-[var(--color-text-secondary)] text-xs shrink-0 ml-2">Safe storage</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Why You Were Matched */}
              {opportunity.matchReasons && opportunity.matchReasons.length > 0 && (
                <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                    <span>Why Alongby Matched You for This Project</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {opportunity.matchReasons.map((reason, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-medium"
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
              <Card className="p-6 space-y-5 border-[var(--color-border-strong)]">
                {/* Mode Selector */}
                <div
                  role="tablist"
                  aria-label="Response mode"
                  className="flex items-center p-1 bg-[var(--color-surface-secondary)] rounded-[var(--radius-button)] border border-[var(--color-border)] text-[13px] font-medium"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={actionTab === 'quote'}
                    onClick={() => setActionTab('quote')}
                    className={`flex-1 py-2 px-2 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                      actionTab === 'quote'
                        ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)] font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Standard Quote
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={actionTab === 'alternative'}
                    onClick={() => setActionTab('alternative')}
                    className={`flex-1 py-2 px-2 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                      actionTab === 'alternative'
                        ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)] font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Alternative Scope
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={actionTab === 'pass'}
                    onClick={() => setActionTab('pass')}
                    className={`flex-1 py-2 px-2 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                      actionTab === 'pass'
                        ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)] font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Pass
                  </button>
                </div>

                {/* MODE A: STANDARD QUOTE */}
                {actionTab === 'quote' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="typo-card-title text-[var(--color-text-primary)]">
                        Submit Commercial Quote
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Propose fixed pricing and delivery terms matching client requirements.
                      </p>
                    </div>

                    {/* Price Input */}
                    <div>
                      <Input
                        label="Total Commercial Amount (€ EUR) *"
                        type="number"
                        placeholder="e.g. 2500"
                        value={amountEuros}
                        onChange={(e) => setAmountEuros(e.target.value)}
                        leftIcon={<Euro className="w-4 h-4 text-[var(--color-text-muted)]" />}
                        className="tabular-nums"
                      />

                      {/* Real-time budget feedback indicator */}
                      {budgetRelation && (
                        <div className="mt-1.5 text-xs font-medium tabular-nums">
                          {budgetRelation === 'within' && (
                            <span className="text-[var(--color-success-text)]">✓ Within client indicative range</span>
                          )}
                          {budgetRelation === 'slightly_above' && (
                            <span className="text-[var(--color-warning-text)]">
                              ℹ Slightly above client max (€{(maxIndicative / 100).toLocaleString()})
                            </span>
                          )}
                          {budgetRelation === 'materially_above' && (
                            <span className="text-[var(--color-text-secondary)]">
                              ℹ Materially above client max; consider an alternative proposal if appropriate
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Kick-off Date *"
                        type="date"
                        value={proposedStartDate}
                        onChange={(e) => setProposedStartDate(e.target.value)}
                        className="tabular-nums"
                      />
                      <Input
                        label="Duration (Days) *"
                        type="number"
                        min="1"
                        value={durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 1)}
                        className="tabular-nums"
                      />
                    </div>

                    <Input
                      label="Revisions Included *"
                      type="number"
                      min="0"
                      max="10"
                      value={revisionsIncluded}
                      onChange={(e) => setRevisionsIncluded(parseInt(e.target.value, 10) || 0)}
                      className="tabular-nums"
                    />

                    {/* Scope Delivery Summary */}
                    <Textarea
                      label="Scope Delivery Summary *"
                      rows={3}
                      placeholder="Detail the technical approach, milestones, and deliverables included in this quote..."
                      value={scopeSummary}
                      onChange={(e) => setScopeSummary(e.target.value)}
                    />

                    {/* Inclusions */}
                    <div>
                      <label className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5">
                        Included Deliverables
                      </label>
                      <div className="space-y-1.5 mb-2">
                        {includedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs p-2.5 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]"
                          >
                            <span className="break-words">· {item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIncluded(idx)}
                              aria-label={`Remove included deliverable: ${item}`}
                              className="text-[var(--color-text-muted)] hover:text-[var(--color-error-text)] shrink-0 ml-2 p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
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
                          className="flex-1 px-3.5 py-2 min-h-[40px] text-sm font-normal text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-[var(--radius-input)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={handleAddIncluded}>
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Exclusions */}
                    <div>
                      <label className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5">
                        Exclusions (Out of Scope)
                      </label>
                      <div className="space-y-1.5 mb-2">
                        {excludedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs p-2.5 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]"
                          >
                            <span className="break-words">✕ {item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExcluded(idx)}
                              aria-label={`Remove exclusion: ${item}`}
                              className="text-[var(--color-text-muted)] hover:text-[var(--color-error-text)] shrink-0 ml-2 p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
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
                          className="flex-1 px-3.5 py-2 min-h-[40px] text-sm font-normal text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-[var(--radius-input)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={handleAddExcluded}>
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
                      <h3 className="typo-card-title text-[var(--color-text-primary)]">
                        Submit Alternative Proposal
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Recommend a modified scope, phased delivery, or different architecture.
                      </p>
                    </div>

                    <Textarea
                      label="Alternative Proposal Justification *"
                      rows={3}
                      placeholder="Explain to the client why an alternative scope or phased approach is recommended for best results..."
                      value={alternativeExplanation}
                      onChange={(e) => setAlternativeExplanation(e.target.value)}
                    />

                    <Input
                      label="Proposed Price (€ EUR) *"
                      type="number"
                      placeholder="e.g. 3200"
                      value={amountEuros}
                      onChange={(e) => setAmountEuros(e.target.value)}
                      leftIcon={<Euro className="w-4 h-4 text-[var(--color-text-muted)]" />}
                      className="tabular-nums"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Kick-off Date *"
                        type="date"
                        value={proposedStartDate}
                        onChange={(e) => setProposedStartDate(e.target.value)}
                        className="tabular-nums"
                      />
                      <Input
                        label="Duration (Days) *"
                        type="number"
                        min="1"
                        value={durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 1)}
                        className="tabular-nums"
                      />
                    </div>

                    <Textarea
                      label="Alternative Scope Deliverables *"
                      rows={3}
                      placeholder="Detail what is delivered in this alternative proposal..."
                      value={scopeSummary}
                      onChange={(e) => setScopeSummary(e.target.value)}
                    />

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
                      <h3 className="typo-card-title text-[var(--color-text-primary)]">
                        Pass on Opportunity
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Let us know why you cannot accept this brief. This maintains your marketplace reliability standing.
                      </p>
                    </div>

                    <Select
                      label="Reason for passing *"
                      value={passReason}
                      onChange={(e) => setPassReason(e.target.value as PassReason)}
                      options={[
                        { value: 'not_available', label: 'I am currently fully booked / no capacity' },
                        { value: 'budget_too_low', label: 'Client budget is below my engagement floor' },
                        { value: 'scope_not_fit', label: 'Project scope does not fit my preferred work' },
                        { value: 'timeline_not_fit', label: 'Client timeline is too tight' },
                        { value: 'outside_expertise', label: 'Technical requirements outside my stack' },
                        { value: 'other', label: 'Other reason' },
                      ]}
                    />

                    <Textarea
                      label="Private Note to Alongby Curators (Optional)"
                      rows={3}
                      placeholder="Share any additional context or when you might be open for similar briefs..."
                      value={passNote}
                      onChange={(e) => setPassNote(e.target.value)}
                    />

                    <Button
                      variant="outline"
                      className="w-full text-[var(--color-error-text)] border-[var(--color-error-border)] hover:bg-[var(--color-error-bg)]"
                      isLoading={submitting}
                      onClick={handlePass}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Confirm: Pass on this Opportunity
                    </Button>
                  </div>
                )}
              </Card>
            ) : existingQuote ? (
              /* READ-ONLY SUBMITTED QUOTE CARD */
              <Card className="p-6 space-y-4 bg-[var(--color-surface)] border-[var(--color-border-strong)]">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] gap-2">
                  <h3 className="typo-card-title text-[var(--color-text-primary)]">
                    {existingQuote.quoteType === 'alternative'
                      ? 'Alternative Proposal Submitted'
                      : 'Commercial Quote Submitted'}
                  </h3>
                  <Badge variant="success">Locked (v1)</Badge>
                </div>

                <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)]">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">Proposed Amount</span>
                  <span className="text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)] break-words">
                    €{(existingQuote.amountMinor / 100).toLocaleString()} {existingQuote.currency}
                  </span>
                </div>

                {existingQuote.alternativeExplanation && (
                  <div className="p-3.5 rounded-[var(--radius-button)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-xs text-[var(--color-warning-text)]">
                    <strong className="block mb-1 font-semibold">Proposal Justification</strong>
                    <p className="leading-relaxed break-words">{existingQuote.alternativeExplanation}</p>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">Scope Summary</span>
                  <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] p-3.5 rounded-[var(--radius-button)] leading-relaxed whitespace-pre-wrap break-words">
                    {existingQuote.scopeSummary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">Proposed Kick-off</span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">{existingQuote.proposedStartDate}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">Duration</span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">{existingQuote.estimatedDurationDays} days</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">Revisions</span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">{existingQuote.revisionsIncluded} included</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">Status</span>
                    <span className="font-semibold text-[var(--color-text-primary)] uppercase">{existingQuote.status}</span>
                  </div>
                </div>

                {existingQuote.includedItems && existingQuote.includedItems.length > 0 && (
                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">Inclusions</span>
                    <ul className="list-disc list-inside text-xs text-[var(--color-text-secondary)] space-y-0.5 leading-relaxed">
                      {existingQuote.includedItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {existingQuote.excludedItems && existingQuote.excludedItems.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">Exclusions</span>
                    <ul className="list-disc list-inside text-xs text-[var(--color-text-secondary)] space-y-0.5 leading-relaxed">
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
