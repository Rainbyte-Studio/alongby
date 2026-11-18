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
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { opportunityService } from '../../services/opportunityService';
import { quoteService } from '../../services/quoteService';
import {
  formatProjectBudget,
  formatTimelineOption,
  getOpportunityStatusDisplay,
} from '../../utils/statusMapping';
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
  Compass,
  CheckCircle2,
  XCircle,
  FileText,
  Trash2,
  Send,
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
  const [showPassConfirmModal, setShowPassConfirmModal] = useState(false);

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
      if (
        opp.status === 'interested' ||
        opp.status === 'alternative_proposal' ||
        opp.status === 'selected' ||
        opp.quoteId
      ) {
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
    if (!opportunity || !currentUser || submitting) return;

    const parsedEuros = parseFloat(amountEuros);
    if (isNaN(parsedEuros) || parsedEuros <= 0) {
      setErrorMsg('Please enter a valid commercial amount in Euros.');
      return;
    }
    if (!scopeSummary.trim() || scopeSummary.trim().length < 15) {
      setErrorMsg('Please provide a clear scope delivery summary (minimum 15 characters).');
      return;
    }
    if (type === 'alternative' && (!alternativeExplanation.trim() || alternativeExplanation.trim().length < 10)) {
      setErrorMsg('Please explain why you are proposing an alternative scope or phased approach.');
      return;
    }
    if (!proposedStartDate) {
      setErrorMsg('Please specify your proposed kickoff date.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const amountMinor = Math.round(parsedEuros * 100);

      await quoteService.submitQuote(
        {
          opportunityId: opportunity.id,
          quoteType: type,
          amountMinor,
          scopeSummary: scopeSummary.trim(),
          includedItems,
          excludedItems,
          proposedStartDate,
          estimatedDurationDays: durationDays,
          revisionsIncluded,
          note: note.trim() || undefined,
          alternativeExplanation: type === 'alternative' ? alternativeExplanation.trim() : undefined,
        },
        currentUser.uid
      );

      setSuccessMsg(
        type === 'standard'
          ? 'Your commercial quote has been recorded and submitted to Alongby curation.'
          : 'Your alternative scope proposal has been recorded and submitted to Alongby curation.'
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
    if (!opportunity || !currentUser || submitting) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await opportunityService.passOpportunity(
        opportunity.id,
        currentUser.uid,
        passReason,
        passNote.trim() || undefined
      );

      setShowPassConfirmModal(false);
      setSuccessMsg('You have declined this opportunity. Your availability standing remains intact.');
      await loadOpportunity();
    } catch (err: any) {
      console.error('Error passing on opportunity:', err);
      setErrorMsg(err.message || 'Failed to decline opportunity.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="professional" title="Opportunity Specifications">
        <div className="py-24 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" label="Loading project brief specifications…" />
        </div>
      </DashboardLayout>
    );
  }

  if (errorMsg && !opportunity) {
    return (
      <DashboardLayout
        role="professional"
        breadcrumbs={[
          { label: 'Workspace', to: '/professional' },
          { label: 'Opportunities', to: '/professional/opportunities' },
          { label: 'Unavailable' },
        ]}
        title="Project Opportunity"
      >
        <EmptyState
          title="Opportunity Unavailable"
          description={errorMsg}
          action={{
            label: 'Back to Opportunities',
            onClick: () => navigate('/professional/opportunities'),
          }}
        />
      </DashboardLayout>
    );
  }

  if (!opportunity) return null;

  const snap = opportunity.projectSnapshot;
  const statusDisplay = getOpportunityStatusDisplay(opportunity.status);
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
      role="professional"
      breadcrumbs={[
        { label: 'Workspace', to: '/professional' },
        { label: 'Opportunities', to: '/professional/opportunities' },
        { label: snap.title },
      ]}
      title={snap.title}
      subtitle={`${snap.serviceName} · ${snap.projectTypeName} · Response window closes ${new Date(opportunity.expiresAt).toLocaleDateString()}`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusDisplay.variant} size="md">
            {statusDisplay.label}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/professional/opportunities')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            All Opportunities
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-12">
        {/* Alerts */}
        {successMsg && (
          <Alert variant="success" onDismiss={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {errorMsg && (
          <Alert variant="error" onDismiss={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {/* Status Notice Banner if Selected */}
        {(existingQuote?.status === 'selected' || opportunity.status === 'selected') && (
          <div className="p-5 sm:p-6 rounded-[var(--radius-card)] bg-[var(--color-primary)] text-[var(--color-primary-text)] border border-[var(--color-primary)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold">Selected by Client</span>
              </div>
              <h2 className="typo-section-heading text-[var(--color-primary-text)]">
                Client Selected Your Proposal
              </h2>
              <p className="text-[13px] text-white/80 max-w-2xl leading-relaxed">
                The client selected your quote from the shortlist. Review Commercial Proposal v1 (deliverables, acceptance criteria, and two-stage payment schedule) and proceed to agreement signing.
              </p>
            </div>

            <div className="shrink-0 flex flex-wrap items-center gap-2">
              <Link to={`/professional/projects/${opportunity.projectId}/proposal`}>
                <Button variant="white" size="sm">
                  Review Proposal
                </Button>
              </Link>
              <Link to={`/professional/projects/${opportunity.projectId}/contract`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent text-white border-white/35 hover:bg-white/10"
                >
                  Service Agreement
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Status Notice Banner if Already Responded */}
        {opportunity.status === 'interested' &&
          existingQuote &&
          existingQuote.status !== 'selected' && (
            <Alert variant="success" title="Standard Quote Submitted & Locked">
              You submitted a commercial quote of{' '}
              <strong className="font-semibold tabular-nums">
                €{(existingQuote.amountMinor / 100).toLocaleString()}
              </strong>{' '}
              on{' '}
              <span className="tabular-nums">
                {new Date(existingQuote.submittedAt).toLocaleDateString()}
              </span>
              . Alongby curators review submitted quotes before publishing the client shortlist.
            </Alert>
          )}

        {opportunity.status === 'alternative_proposal' &&
          existingQuote &&
          existingQuote.status !== 'selected' && (
            <Alert variant="info" title="Alternative Scope Proposal Submitted">
              You submitted an alternative proposal of{' '}
              <strong className="font-semibold tabular-nums">
                €{(existingQuote.amountMinor / 100).toLocaleString()}
              </strong>{' '}
              with custom delivery scope on{' '}
              <span className="tabular-nums">
                {new Date(existingQuote.submittedAt).toLocaleDateString()}
              </span>
              .
            </Alert>
          )}

        {opportunity.status === 'passed' && (
          <Alert variant="neutral" title="Opportunity Declined">
            You declined to quote on this brief ({opportunity.passReason?.replace(/_/g, ' ')}).
          </Alert>
        )}

        {opportunity.status === 'not_selected' && (
          <Alert variant="neutral" title="Shortlist Concluded">
            The client selected another shortlisted specialist for this engagement. Thank you for preparing a quote.
          </Alert>
        )}

        {isExpired && (opportunity.status === 'expired' || opportunity.status === 'pending' || opportunity.status === 'viewed') && (
          <Alert variant="warning" title="Response Window Closed">
            The response window for this invitation closed on{' '}
            <span className="tabular-nums">
              {new Date(opportunity.expiresAt).toLocaleDateString()}
            </span>
            .
          </Alert>
        )}

        {/* 2-Column Layout: Project Specifications on Left, Quote/Action on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Project Specifications */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 space-y-6">
              <div className="pb-4 border-b border-[var(--color-border)]">
                <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-1">
                  Client Project Brief Specification
                </span>
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                  {snap.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {snap.serviceName}
                  </span>
                  <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[var(--color-text-secondary)] font-medium">
                    {snap.projectTypeName}
                  </span>
                  {snap.industryName && (
                    <>
                      <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-[var(--color-text-secondary)] font-medium">
                        {snap.industryName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                  Project Overview
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap break-words">
                  {snap.description}
                </p>
              </div>

              {/* Goals */}
              {snap.goals && snap.goals.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                    Primary Goals
                  </h3>
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
                  <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                    Required Features &amp; Deliverables
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {snap.features.join(' · ')}
                  </p>
                </div>
              )}

              {/* Existing Assets */}
              {snap.existingAssets && snap.existingAssets.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                    Existing Client Assets
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {snap.existingAssets.join(' · ')}
                  </p>
                </div>
              )}

              {/* Indicative Budget & Timeline */}
              <div className="pt-4 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                    <span>Indicative Client Budget</span>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-[var(--color-text-primary)] break-words">
                    {formatProjectBudget(snap.indicativeBudget)}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Non-binding guidance; quote your true engagement fee
                  </div>
                </div>

                <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                    <span>Target Timeline</span>
                  </div>
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">
                    Start: {formatTimelineOption(snap.timeline?.preferredStart)}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Flexibility: {formatTimelineOption(snap.timeline?.flexibility)}
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {snap.attachments && snap.attachments.length > 0 && (
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2 tabular-nums">
                    Reference Attachments ({snap.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {snap.attachments.map((att) => (
                      <div
                        key={att.fileId}
                        className="flex items-center justify-between p-3 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
                          <span className="font-medium text-[var(--color-text-primary)] break-words">
                            {att.name}
                          </span>
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
                            Open File
                          </a>
                        ) : (
                          <span className="text-[var(--color-text-secondary)] text-xs shrink-0 ml-2">
                            Stored
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Why You Were Matched */}
              {opportunity.matchReasons && opportunity.matchReasons.length > 0 && (
                <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                    <Compass className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                    <span>Why Alongby Invited You</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {opportunity.matchReasons.join(' · ')}
                  </p>
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
                  aria-label="Opportunity response mode"
                  className="flex items-center p-1 bg-[var(--color-surface-secondary)] rounded-[var(--radius-button)] border border-[var(--color-border)] text-xs sm:text-[13px] font-medium"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={actionTab === 'quote'}
                    onClick={() => {
                      setActionTab('quote');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-2 px-2 rounded-md transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
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
                    onClick={() => {
                      setActionTab('alternative');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-2 px-2 rounded-md transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                      actionTab === 'alternative'
                        ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)] font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Alternative
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={actionTab === 'pass'}
                    onClick={() => {
                      setActionTab('pass');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-2 px-2 rounded-md transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                      actionTab === 'pass'
                        ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)] font-semibold'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Decline
                  </button>
                </div>

                {/* MODES A & B: STANDARD QUOTE OR ALTERNATIVE PROPOSAL */}
                {(actionTab === 'quote' || actionTab === 'alternative') && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="typo-card-title text-[var(--color-text-primary)]">
                        {actionTab === 'quote'
                          ? 'Submit Commercial Quote'
                          : 'Submit Alternative Scope Proposal'}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                        {actionTab === 'quote'
                          ? 'Propose fixed pricing, timeline, and deliverables matching the client brief.'
                          : 'Recommend a modified scope, phased MVP, or alternative technical approach.'}
                      </p>
                    </div>

                    {actionTab === 'alternative' && (
                      <Textarea
                        id="quote-alt-rationale"
                        label="Alternative Scope Rationale"
                        required
                        rows={3}
                        placeholder="Explain to the client why an adjusted scope or phased delivery is recommended..."
                        value={alternativeExplanation}
                        onChange={(e) => setAlternativeExplanation(e.target.value)}
                      />
                    )}

                    {/* Price Input */}
                    <div>
                      <Input
                        id="quote-amount-eur"
                        label="Total Commercial Fee (€ EUR)"
                        required
                        type="number"
                        min="1"
                        placeholder="e.g. 2800"
                        value={amountEuros}
                        onChange={(e) => setAmountEuros(e.target.value)}
                        leftIcon={<Euro className="w-4 h-4 text-[var(--color-text-muted)]" />}
                        className="tabular-nums"
                      />

                      {budgetRelation && (
                        <div className="mt-1.5 text-xs font-medium tabular-nums">
                          {budgetRelation === 'within' && (
                            <span className="text-[var(--color-success-text)]">
                              ✓ Within client indicative range
                            </span>
                          )}
                          {budgetRelation === 'slightly_above' && (
                            <span className="text-[var(--color-warning-text)]">
                              Slightly above indicative max (€{(maxIndicative / 100).toLocaleString()})
                            </span>
                          )}
                          {budgetRelation === 'materially_above' && (
                            <span className="text-[var(--color-text-secondary)]">
                              Above indicative range — consider adding clear scope justification
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        id="quote-start-date"
                        label="Proposed Start Date"
                        required
                        type="date"
                        value={proposedStartDate}
                        onChange={(e) => setProposedStartDate(e.target.value)}
                        className="tabular-nums"
                      />
                      <Input
                        id="quote-duration-days"
                        label="Duration (Days)"
                        required
                        type="number"
                        min="1"
                        value={durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 1)}
                        className="tabular-nums"
                      />
                    </div>

                    <Input
                      id="quote-revisions"
                      label="Revision Rounds Included"
                      required
                      type="number"
                      min="0"
                      max="10"
                      value={revisionsIncluded}
                      onChange={(e) => setRevisionsIncluded(parseInt(e.target.value, 10) || 0)}
                      className="tabular-nums"
                    />

                    {/* Scope Delivery Summary */}
                    <Textarea
                      id="quote-scope-summary"
                      label="Scope Delivery Summary"
                      required
                      rows={3}
                      placeholder="Summarize your execution plan, milestones, and deliverables..."
                      value={scopeSummary}
                      onChange={(e) => setScopeSummary(e.target.value)}
                    />

                    {/* Inclusions */}
                    <div>
                      <span className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5">
                        Included Deliverables
                      </span>
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
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="quote-new-inclusion"
                          aria-label="Add included deliverable"
                          placeholder="Add deliverable (e.g. Design handoff)"
                          value={newIncludedItem}
                          onChange={(e) => setNewIncludedItem(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && (e.preventDefault(), handleAddIncluded())
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddIncluded}
                          className="shrink-0"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Exclusions */}
                    <div>
                      <span className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5">
                        Exclusions (Out of Scope)
                      </span>
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
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="quote-new-exclusion"
                          aria-label="Add exclusion"
                          placeholder="Add exclusion (e.g. Hosting fees)"
                          value={newExcludedItem}
                          onChange={(e) => setNewExcludedItem(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && (e.preventDefault(), handleAddExcluded())
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddExcluded}
                          className="shrink-0"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      id="quote-curator-note"
                      label="Note to Alongby Curators (Optional)"
                      rows={2}
                      placeholder="Optional context on availability or relevant domain case studies..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />

                    <Button
                      variant="primary"
                      className="w-full mt-2"
                      isLoading={submitting}
                      onClick={() =>
                        handleSubmitProposal(actionTab === 'alternative' ? 'alternative' : 'standard')
                      }
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      {actionTab === 'alternative'
                        ? 'Submit Alternative Proposal'
                        : 'Submit Commercial Quote'}
                    </Button>
                  </div>
                )}

                {/* MODE C: PASS ON OPPORTUNITY */}
                {actionTab === 'pass' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="typo-card-title text-[var(--color-text-primary)]">
                        Decline Invitation
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                        Let our curators know why this brief isn't the right fit right now. Prompt responses help keep future invitations well calibrated.
                      </p>
                    </div>

                    <Select
                      id="pass-reason-select"
                      label="Reason for declining"
                      required
                      value={passReason}
                      onChange={(e) => setPassReason(e.target.value as PassReason)}
                      options={[
                        { value: 'not_available', label: 'Currently fully booked / no capacity' },
                        { value: 'budget_too_low', label: 'Indicative budget is below my engagement floor' },
                        { value: 'scope_not_fit', label: 'Project scope does not fit my preferred work' },
                        { value: 'timeline_not_fit', label: 'Client timeline is too tight' },
                        { value: 'outside_expertise', label: 'Technical requirements outside my stack' },
                        { value: 'other', label: 'Other reason' },
                      ]}
                    />

                    <Textarea
                      id="pass-private-note"
                      label="Private Note to Alongby Curators (Optional)"
                      rows={3}
                      placeholder="Share context or when you will next have capacity for similar briefs..."
                      value={passNote}
                      onChange={(e) => setPassNote(e.target.value)}
                    />

                    <Button
                      type="button"
                      variant="danger"
                      className="w-full"
                      disabled={submitting}
                      onClick={() => setShowPassConfirmModal(true)}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Decline This Opportunity
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
                  <Badge variant="success" size="sm">
                    Submitted
                  </Badge>
                </div>

                <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)]">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">
                    Proposed Fee
                  </span>
                  <span className="text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)] break-words">
                    €{(existingQuote.amountMinor / 100).toLocaleString()} {existingQuote.currency}
                  </span>
                </div>

                {existingQuote.alternativeExplanation && (
                  <div className="p-3.5 rounded-[var(--radius-button)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-xs text-[var(--color-warning-text)]">
                    <strong className="block mb-1 font-semibold">Alternative Scope Rationale</strong>
                    <p className="leading-relaxed break-words">
                      {existingQuote.alternativeExplanation}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">
                    Scope Summary
                  </span>
                  <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] p-3.5 rounded-[var(--radius-button)] leading-relaxed whitespace-pre-wrap break-words">
                    {existingQuote.scopeSummary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                      Proposed Start
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                      {existingQuote.proposedStartDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                      Duration
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                      {existingQuote.estimatedDurationDays} days
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                      Revisions
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                      {existingQuote.revisionsIncluded} included
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                      Quote Status
                    </span>
                    <span className="font-semibold text-[var(--color-text-primary)] capitalize">
                      {existingQuote.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {existingQuote.includedItems && existingQuote.includedItems.length > 0 && (
                  <div className="pt-3 border-t border-[var(--color-border)]">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">
                      Inclusions
                    </span>
                    <ul className="list-disc list-inside text-xs text-[var(--color-text-secondary)] space-y-0.5 leading-relaxed">
                      {existingQuote.includedItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {existingQuote.excludedItems && existingQuote.excludedItems.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">
                      Exclusions
                    </span>
                    <ul className="list-disc list-inside text-xs text-[var(--color-text-secondary)] space-y-0.5 leading-relaxed">
                      {existingQuote.excludedItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6 space-y-2">
                <h3 className="typo-card-title text-[var(--color-text-primary)]">
                  Response Closed
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  This invitation is no longer accepting new quotes. You can continue reviewing active invitations in your Opportunities inbox.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Confirm Decline Modal */}
        <Modal
          isOpen={showPassConfirmModal}
          onClose={() => {
            if (!submitting) setShowPassConfirmModal(false);
          }}
          maxWidth="md"
          title="Decline Project Invitation?"
          description={`Confirm that you want to pass on "${snap.title}".`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setShowPassConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={submitting}
                onClick={handlePass}
              >
                Confirm Decline
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
            Once declined, you will not be able to submit a quote for this opportunity, and Alongby curators may invite another verified specialist in your place.
          </p>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
