import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Checkbox } from '../../components/ui/Checkbox';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { projectService } from '../../services/projectService';
import { taxonomyService } from '../../services/taxonomyService';
import {
  shortlistService,
  EvaluatedCandidateRecord,
  SHORTLIST_CONFIG,
} from '../../services/shortlistService';
import { matchExplanationService } from '../../services/matchExplanationService';
import {
  formatProjectBudget,
  getBudgetRelationDisplay,
} from '../../utils/statusMapping';
import {
  Project,
  InternalShortlist,
  PublishedShortlist,
} from '../../types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Send,
  Star,
  ShieldCheck,
  AlertCircle,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Lock,
  X,
} from 'lucide-react';

export const AdminShortlistPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [candidates, setCandidates] = useState<EvaluatedCandidateRecord[]>([]);
  const [internalShortlist, setInternalShortlist] = useState<InternalShortlist | null>(null);
  const [publishedShortlist, setPublishedShortlist] = useState<PublishedShortlist | null>(null);
  const [loading, setLoading] = useState(true);

  // Draft editing state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [recommendedProfId, setRecommendedProfId] = useState<string | undefined>(undefined);
  const [recommendationRationale, setRecommendationRationale] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [overrideApplied, setOverrideApplied] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');

  // UI state
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'eligible' | 'shortlisted'>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const [projData, candidateList, draftShortlist, pubShortlist] = await Promise.all([
        projectService.getProject(projectId),
        shortlistService.getEligibleCandidatesForShortlist(projectId),
        shortlistService.getInternalShortlist(projectId),
        shortlistService.getPublishedShortlist(projectId),
      ]);

      setProject(projData);
      setCandidates(candidateList);
      setInternalShortlist(draftShortlist);
      setPublishedShortlist(pubShortlist);

      if (draftShortlist) {
        setSelectedCandidateIds(draftShortlist.candidateIds || []);
        const rec = draftShortlist.items.find((item) => item.isRecommended);
        if (rec) {
          setRecommendedProfId(rec.professionalId);
          setRecommendationRationale(rec.recommendationRationale || '');
        }
        setAdminNotes(draftShortlist.adminNotes || '');
        setOverrideApplied(draftShortlist.overrideApplied || false);
        setOverrideReason(draftShortlist.overrideReason || '');
      } else {
        const eligibleOnes = candidateList
          .filter((c) => c.eligibility.eligible)
          .slice(0, SHORTLIST_CONFIG.targetSize)
          .map((c) => c.professional.userId);
        setSelectedCandidateIds(eligibleOnes);
      }
    } catch (err: any) {
      console.error('Failed to load shortlist review data:', err);
      setErrorMsg(err?.message || 'Failed to load shortlist review data.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleCandidate = (profId: string) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(profId)) {
        if (recommendedProfId === profId) {
          setRecommendedProfId(undefined);
          setRecommendationRationale('');
        }
        return prev.filter((id) => id !== profId);
      } else {
        if (prev.length >= SHORTLIST_CONFIG.maxSize) {
          setErrorMsg(
            `Maximum shortlist size is ${SHORTLIST_CONFIG.maxSize} professionals. Remove one before adding another.`
          );
          return prev;
        }
        setErrorMsg(null);
        return [...prev, profId];
      }
    });
  };

  const handleMoveOrder = (profId: string, direction: 'up' | 'down') => {
    setSelectedCandidateIds((prev) => {
      const idx = prev.indexOf(profId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleSaveDraft = async () => {
    if (!projectId || !currentUser) return;
    try {
      setSavingDraft(true);
      setErrorMsg(null);
      const saved = await shortlistService.saveDraftShortlist(
        projectId,
        selectedCandidateIds,
        currentUser.uid,
        {
          adminNotes,
          recommendedProfId,
          recommendationRationale,
          overrideApplied,
          overrideReason,
        }
      );
      setInternalShortlist(saved);
      setSuccessMsg('Shortlist draft saved.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      setErrorMsg(err?.message || 'Failed to save shortlist draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublishShortlist = async () => {
    if (!projectId || !currentUser) return;
    try {
      setPublishing(true);
      setErrorMsg(null);

      const draft = await shortlistService.saveDraftShortlist(
        projectId,
        selectedCandidateIds,
        currentUser.uid,
        {
          adminNotes,
          recommendedProfId,
          recommendationRationale,
          overrideApplied,
          overrideReason,
        }
      );

      const published = await shortlistService.publishShortlist(
        projectId,
        draft.id,
        currentUser.uid,
        {
          overrideApplied,
          overrideReason,
        }
      );

      setPublishedShortlist(published);
      setShowPublishModal(false);
      setSuccessMsg(
        'Curated shortlist published to client. Raw scores and internal notes were stripped automatically.'
      );
      loadData();
    } catch (err: any) {
      console.error('Failed to publish shortlist:', err);
      setErrorMsg(err?.message || 'Failed to publish shortlist.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" title="Curated Shortlist Review">
        <div className="flex flex-col items-center justify-center min-h-[360px]">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-xs text-[var(--color-text-muted)] font-sans">
            Loading shortlist evaluation records…
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="admin" title="Curated Shortlist Review">
        <EmptyState
          title="Project not found"
          description="The requested project could not be found."
          action={{
            label: 'Back to Operations Console',
            onClick: () => navigate('/admin'),
          }}
        />
      </DashboardLayout>
    );
  }

  const service = taxonomyService.getServiceCategoryById(project.serviceId);
  const budgetRanges = taxonomyService.getBudgetRanges('EUR');
  const lookupRangeLabel = (id: string) => budgetRanges.find((r) => r.id === id)?.label;

  const selectedCandidates = selectedCandidateIds
    .map((id) => candidates.find((c) => c.professional.userId === id))
    .filter(Boolean) as EvaluatedCandidateRecord[];

  const eligibleCandidatesCount = candidates.filter((c) => c.eligibility.eligible).length;

  const filteredCandidates = candidates.filter((c) => {
    if (filterMode === 'eligible') return c.eligibility.eligible;
    if (filterMode === 'shortlisted')
      return selectedCandidateIds.includes(c.professional.userId);
    return true;
  });

  const isShortlistPublished =
    Boolean(publishedShortlist) ||
    project.status === 'shortlist_ready' ||
    project.status === 'professional_selected';

  void internalShortlist;

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Operations Console', to: '/admin' },
        { label: project.title || 'Project', to: `/client/projects/${project.id}` },
        { label: 'Shortlist Curation' },
      ]}
      title="Curated Shortlist Review"
      subtitle={`Select ${SHORTLIST_CONFIG.minimumSize}–${SHORTLIST_CONFIG.maxSize} verified specialists to publish to ${
        project.clientName || 'the client'
      }.`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/admin/projects/${project.id}/matching`}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Matching Pool
            </Button>
          </Link>
          <Link to={`/client/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              Project Brief
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {successMsg && (
          <Alert variant="success" onDismiss={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {errorMsg && (
          <Alert
            variant="error"
            title="Shortlist curation notice"
            onDismiss={() => setErrorMsg(null)}
          >
            {errorMsg}
          </Alert>
        )}

        {/* Project Context Strip */}
        <Card className="p-5 bg-[var(--color-surface)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
            <div>
              <span className="text-[var(--color-text-muted)] font-medium block mb-1">
                Client
              </span>
              <span className="font-semibold text-[var(--color-text-primary)] text-sm break-words">
                {project.clientName || 'Client'}
                {project.clientCompanyName ? ` · ${project.clientCompanyName}` : ''}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] font-medium block mb-1">
                Service
              </span>
              <span className="font-semibold text-[var(--color-text-primary)] text-sm">
                {service?.name || project.serviceId?.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] font-medium block mb-1">
                Indicative Budget
              </span>
              <span className="font-semibold tabular-nums text-[var(--color-text-primary)] text-sm">
                {formatProjectBudget(project.brief?.budget, lookupRangeLabel)}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] font-medium block mb-1">
                Publication State
              </span>
              {isShortlistPublished ? (
                <Badge variant="success" size="sm">
                  Published to Client
                </Badge>
              ) : (
                <Badge variant="outline" size="sm">
                  Internal Draft ({candidates.length} responses)
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Published Client-Safe Shortlist Banner (Visually Distinct from Internal Data) */}
        {publishedShortlist && (
          <Card className="p-5 sm:p-6 border-[var(--color-success-border)] bg-[var(--color-success-bg)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0" aria-hidden="true" />
                  <h2 className="typo-card-title text-[var(--color-success-text)]">
                    Client-Safe Shortlist Published (v{publishedShortlist.version})
                  </h2>
                </div>
                <p className="text-xs text-[var(--color-success-text)] max-w-2xl font-sans tabular-nums leading-relaxed">
                  Published on {new Date(publishedShortlist.publishedAt).toLocaleString()} with{' '}
                  {publishedShortlist.candidates.length} curated finalists. Client-visible snapshot excludes internal scores and curator notes.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/client/projects/${project.id}/matches`}>
                  <Button variant="white" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                    Inspect Client Shortlist View
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Shortlist Curation Two-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Cols: Candidate Responses & Internal Evaluation */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
              <div
                role="tablist"
                aria-label="Filter shortlist candidates"
                className="flex flex-wrap items-center gap-1 p-1 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-[13px]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterMode === 'all'}
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-[6px] font-medium tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    filterMode === 'all'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                  }`}
                >
                  All Responses ({candidates.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterMode === 'eligible'}
                  onClick={() => setFilterMode('eligible')}
                  className={`px-3 py-1.5 rounded-[6px] font-medium tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    filterMode === 'eligible'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                  }`}
                >
                  Eligible ({eligibleCandidatesCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterMode === 'shortlisted'}
                  onClick={() => setFilterMode('shortlisted')}
                  className={`px-3 py-1.5 rounded-[6px] font-medium tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    filterMode === 'shortlisted'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                  }`}
                >
                  In Shortlist ({selectedCandidateIds.length})
                </button>
              </div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium tabular-nums">
                Target: {SHORTLIST_CONFIG.minimumSize}–{SHORTLIST_CONFIG.maxSize} finalists
              </span>
            </div>

            {filteredCandidates.length === 0 ? (
              <EmptyState
                title="No candidates in this view"
                description={
                  candidates.length === 0
                    ? 'No quotes have been submitted yet. Dispatch opportunities from the Matching Pool first.'
                    : filterMode === 'eligible'
                    ? 'No candidates currently satisfy all automated shortlist eligibility criteria.'
                    : 'No responses match the active filter.'
                }
                action={
                  candidates.length === 0
                    ? {
                        label: 'Open Matching Pool',
                        onClick: () => navigate(`/admin/projects/${project.id}/matching`),
                      }
                    : undefined
                }
              />
            ) : (
              filteredCandidates.map((cand) => {
                const isSelected = selectedCandidateIds.includes(cand.professional.userId);
                const isRecommended = recommendedProfId === cand.professional.userId;
                const isExpanded = expandedCandidateId === cand.professional.userId;
                const quote = cand.quote;
                const clientExplanation =
                  matchExplanationService.generateClientSafeExplanation(
                    project,
                    cand.professional,
                    cand.availability,
                    cand.quote || {
                      id: '',
                      projectId: project.id,
                      opportunityId: cand.opportunity.id,
                      matchId: cand.match.id,
                      professionalId: cand.professional.userId,
                      quoteType: 'standard',
                      amountMinor: 0,
                      currency: 'EUR',
                      scopeSummary: '',
                      includedItems: [],
                      excludedItems: [],
                      proposedStartDate: '',
                      estimatedDurationDays: 0,
                      revisionsIncluded: 0,
                      budgetRelation: 'within_budget',
                      status: 'submitted',
                      version: 1,
                      createdAt: '',
                      submittedAt: '',
                      updatedAt: '',
                    }
                  );

                return (
                  <Card
                    key={cand.professional.userId}
                    className={`p-5 transition-colors ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      {/* Candidate Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center justify-center font-sans font-semibold text-base shrink-0">
                            {cand.professional.displayName?.charAt(0) || 'P'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="typo-card-title text-[var(--color-text-primary)]">
                                {cand.professional.displayName}
                              </h3>
                              <Badge variant="outline" size="sm">
                                <ShieldCheck className="w-3 h-3 mr-1 text-[var(--color-success)]" aria-hidden="true" />
                                Verified
                              </Badge>
                              {cand.eligibility.eligible ? (
                                <Badge variant="success" size="sm">
                                  Eligible
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  Needs Override
                                </Badge>
                              )}
                              {isRecommended && (
                                <Badge variant="warning" size="sm">
                                  <Star className="w-3 h-3 mr-1 fill-[var(--color-warning)] text-[var(--color-warning)]" aria-hidden="true" />
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] font-sans tabular-nums mt-0.5">
                              {cand.professional.professionalTitle} · {cand.professional.country} ·{' '}
                              {cand.professional.yearsOfExperience} yrs exp
                            </p>
                          </div>
                        </div>

                        {/* Internal Match Score + Selection Toggle */}
                        <div className="flex items-center gap-3 sm:self-start shrink-0">
                          <div
                            title="Internal Admin Score (stripped from client shortlist)"
                            className="px-2.5 py-1 rounded-[var(--radius-input)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-right"
                          >
                            <span className="text-[11px] font-medium text-[var(--color-text-muted)] block leading-none">
                              Admin Score
                            </span>
                            <span className="text-sm font-bold font-sans tabular-nums text-[var(--color-text-primary)]">
                              {cand.match.matchScore}
                              <span className="text-[var(--color-text-muted)] font-normal text-xs">
                                /100
                              </span>
                            </span>
                          </div>

                          <Button
                            variant={isSelected ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleCandidate(cand.professional.userId)}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-4 h-4 mr-1 text-[var(--color-success)]" aria-hidden="true" />
                                Shortlisted
                              </>
                            ) : (
                              'Add to Shortlist'
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Commercial Quote Summary */}
                      {quote && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[var(--color-surface-secondary)]/60 rounded-[var(--radius-input)] border border-[var(--color-border)] text-xs">
                          <div>
                            <span className="text-[var(--color-text-muted)] font-medium block mb-0.5">
                              Quote Amount
                            </span>
                            <span className="font-bold tabular-nums text-[var(--color-text-primary)] text-sm">
                              €{(quote.amountMinor / 100).toLocaleString()} {quote.currency}
                            </span>
                            {quote.quoteType === 'alternative' && (
                              <span className="text-[11px] text-[var(--color-warning-text)] font-medium block">
                                Alternative Scope
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)] font-medium block mb-0.5">
                              Start &amp; Duration
                            </span>
                            <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
                              {quote.proposedStartDate || 'Immediate'} ({quote.estimatedDurationDays}d)
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)] font-medium block mb-0.5">
                              Deliverables
                            </span>
                            <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
                              {quote.includedItems?.length || 0} items · {quote.revisionsIncluded}{' '}
                              rev.
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)] font-medium block mb-0.5">
                              Budget Fit
                            </span>
                            <Badge variant={getBudgetRelationDisplay(quote.budgetRelation).variant}>
                              {getBudgetRelationDisplay(quote.budgetRelation).label}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Client-Safe Explanation Preview (Explicitly marked Client-Visible) */}
                      <div className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] text-xs font-sans">
                        <span className="font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                          <span>Client-Visible Match Explanation (No Raw Scores):</span>
                        </span>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed">
                          &ldquo;{clientExplanation}&rdquo;
                        </p>
                      </div>

                      {/* Internal Admin Eligibility & Warnings */}
                      {(!cand.eligibility.eligible ||
                        cand.eligibility.warnings.length > 0) && (
                        <div className="space-y-1.5 text-xs">
                          {!cand.eligibility.eligible && (
                            <div className="flex items-start gap-2 text-[var(--color-error-text)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] p-2.5 rounded-[var(--radius-input)]">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-error)]" aria-hidden="true" />
                              <div>
                                <span className="font-semibold">
                                  Internal Eligibility Flags (Admin Only):
                                </span>
                                <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                                  {cand.eligibility.reasons.map((r, i) => (
                                    <li key={i}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                          {cand.eligibility.warnings.length > 0 && (
                            <div className="flex items-start gap-2 text-[var(--color-warning-text)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-2.5 rounded-[var(--radius-input)]">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-warning)]" aria-hidden="true" />
                              <div>
                                <span className="font-semibold">
                                  Curator Warnings (Admin Only):
                                </span>
                                <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                                  {cand.eligibility.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expandable Quote Inspection */}
                      <div>
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setExpandedCandidateId(
                              isExpanded ? null : cand.professional.userId
                            )
                          }
                          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1 font-medium cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                              Hide Scope &amp; Deliverables
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                              Inspect Full Quote Scope &amp; Terms
                            </>
                          )}
                        </button>

                        {isExpanded && quote && (
                          <div className="mt-3 p-4 bg-[var(--color-surface-secondary)]/50 rounded-[var(--radius-input)] border border-[var(--color-border)] space-y-3 text-xs">
                            <div>
                              <span className="font-semibold text-[var(--color-text-primary)] block mb-1">
                                Scope Summary:
                              </span>
                              <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                                {quote.scopeSummary}
                              </p>
                            </div>

                            {quote.includedItems && quote.includedItems.length > 0 && (
                              <div>
                                <span className="font-semibold text-[var(--color-text-primary)] block mb-1">
                                  Included Deliverables:
                                </span>
                                <ul className="list-disc list-inside space-y-0.5 text-[var(--color-text-secondary)]">
                                  {quote.includedItems.map((inc, i) => (
                                    <li key={i}>{inc}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {quote.excludedItems && quote.excludedItems.length > 0 && (
                              <div>
                                <span className="font-semibold text-[var(--color-text-primary)] block mb-1">
                                  Explicit Exclusions:
                                </span>
                                <ul className="list-disc list-inside space-y-0.5 text-[var(--color-text-secondary)]">
                                  {quote.excludedItems.map((exc, i) => (
                                    <li key={i}>{exc}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {quote.note && (
                              <div>
                                <span className="font-semibold text-[var(--color-text-primary)] block mb-1">
                                  Practitioner Note:
                                </span>
                                <p className="text-[var(--color-text-secondary)]">{quote.note}</p>
                              </div>
                            )}

                            {quote.alternativeExplanation && (
                              <div className="p-2.5 bg-[var(--color-warning-bg)] rounded-[var(--radius-input)] border border-[var(--color-warning-border)]">
                                <span className="font-semibold text-[var(--color-warning-text)] block mb-1">
                                  Alternative Scope Rationale:
                                </span>
                                <p className="text-[var(--color-warning-text)]">
                                  {quote.alternativeExplanation}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Right Col: Shortlist Composition & Publication Panel */}
          <div className="space-y-6 lg:sticky lg:top-20">
            <Card className="p-5 border-[var(--color-border-strong)] bg-[var(--color-surface)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4 gap-2">
                <div>
                  <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                    Shortlist Finalists
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] font-sans">
                    Client comparison order (2–3 recommended)
                  </p>
                </div>
                <Badge
                  variant={
                    selectedCandidateIds.length >= SHORTLIST_CONFIG.minimumSize &&
                    selectedCandidateIds.length <= SHORTLIST_CONFIG.maxSize
                      ? 'success'
                      : 'outline'
                  }
                  size="md"
                  className="tabular-nums"
                >
                  {selectedCandidateIds.length} / {SHORTLIST_CONFIG.minimumSize}–
                  {SHORTLIST_CONFIG.maxSize}
                </Badge>
              </div>

              {selectedCandidates.length === 0 ? (
                <div className="p-6 border border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-card)] text-center mb-4">
                  <Layers className="w-7 h-7 text-[var(--color-text-muted)] mx-auto mb-2" aria-hidden="true" />
                  <p className="text-xs text-[var(--color-text-muted)] font-sans leading-relaxed">
                    Select 2–3 eligible practitioners from the left column to assemble the client shortlist.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 mb-5">
                  {selectedCandidates.map((cand, idx) => {
                    const isRec = recommendedProfId === cand.professional.userId;
                    return (
                      <div
                        key={cand.professional.userId}
                        className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-input)] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] flex items-center justify-center font-sans font-semibold tabular-nums text-[11px] shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-[var(--color-text-primary)] truncate block">
                              {cand.professional.displayName}
                            </span>
                            <span className="text-xs text-[var(--color-text-secondary)] tabular-nums truncate block">
                              {cand.quote
                                ? `€${(cand.quote.amountMinor / 100).toLocaleString()} ${cand.quote.currency}`
                                : 'No quote'}
                              {isRec && ' · Recommended'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            title="Move up"
                            aria-label={`Move ${cand.professional.displayName} up`}
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(cand.professional.userId, 'up')}
                            className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            title="Move down"
                            aria-label={`Move ${cand.professional.displayName} down`}
                            disabled={idx === selectedCandidates.length - 1}
                            onClick={() => handleMoveOrder(cand.professional.userId, 'down')}
                            className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            title={
                              isRec
                                ? 'Remove recommendation'
                                : 'Mark as Recommended finalist'
                            }
                            aria-label={
                              isRec
                                ? `Remove recommendation from ${cand.professional.displayName}`
                                : `Mark ${cand.professional.displayName} as recommended`
                            }
                            onClick={() => {
                              if (isRec) {
                                setRecommendedProfId(undefined);
                                setRecommendationRationale('');
                              } else {
                                setRecommendedProfId(cand.professional.userId);
                                setRecommendationRationale(
                                  'Strong alignment of verified domain delivery, scope clarity, and timeline.'
                                );
                              }
                            }}
                            className={`p-1.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                              isRec
                                ? 'text-[var(--color-warning)]'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-warning)]'
                            }`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                isRec ? 'fill-[var(--color-warning)]' : ''
                              }`}
                              aria-hidden="true"
                            />
                          </button>
                          <button
                            type="button"
                            title="Remove from shortlist"
                            aria-label={`Remove ${cand.professional.displayName} from shortlist`}
                            onClick={() => handleToggleCandidate(cand.professional.userId)}
                            className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-error-text)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Client-Visible Recommendation Rationale */}
              {recommendedProfId && (
                <div className="mb-4 p-3.5 bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] rounded-[var(--radius-input)] space-y-2">
                  <Input
                    label="Client-Visible Recommendation Highlight"
                    value={recommendationRationale}
                    onChange={(e) => setRecommendationRationale(e.target.value)}
                    placeholder="e.g. Strongest domain portfolio and earliest kickoff date"
                  />
                </div>
              )}

              {/* Admin-Only Notes */}
              <div className="mb-4 p-3.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-input)] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                  <Lock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                  <span>Internal Curator Notes (Never Shared with Client)</span>
                </div>
                <Textarea
                  aria-label="Internal curator notes"
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal vetting notes, budget stretch context, or rationale…"
                />
              </div>

              {/* Admin Override for <2 Candidates */}
              {selectedCandidateIds.length > 0 &&
                selectedCandidateIds.length < SHORTLIST_CONFIG.minimumSize && (
                  <div className="mb-4 p-3.5 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-[var(--radius-input)] text-xs space-y-3">
                    <div className="flex items-start gap-2 text-[var(--color-error-text)]">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-error)]" aria-hidden="true" />
                      <span>
                        Standard curation requires at least {SHORTLIST_CONFIG.minimumSize}{' '}
                        finalists for client comparison.
                      </span>
                    </div>
                    <Checkbox
                      checked={overrideApplied}
                      onChange={(e) => setOverrideApplied(e.target.checked)}
                      label="Apply Administrator Single-Candidate Override"
                    />
                    {overrideApplied && (
                      <Input
                        aria-label="Administrator override justification"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Mandatory justification (e.g. niche technical requirement)"
                        required
                      />
                    )}
                  </div>
                )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-[var(--color-border)]">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={
                    publishing ||
                    selectedCandidateIds.length === 0 ||
                    (selectedCandidateIds.length < SHORTLIST_CONFIG.minimumSize &&
                      (!overrideApplied || !overrideReason.trim()))
                  }
                  onClick={() => setShowPublishModal(true)}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Publish Shortlist to Client
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  isLoading={savingDraft}
                  onClick={handleSaveDraft}
                >
                  Save Internal Draft
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Publish Confirmation Modal */}
        <Modal
          isOpen={showPublishModal}
          onClose={() => {
            if (!publishing) setShowPublishModal(false);
          }}
          title="Publish Client-Safe Shortlist"
          description="Verify finalists and privacy boundaries before notifying the client."
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="space-y-3 text-sm text-[var(--color-text-secondary)] font-sans">
              <p className="leading-relaxed">
                You are publishing a curated shortlist of{' '}
                <strong className="text-[var(--color-text-primary)] tabular-nums">
                  {selectedCandidates.length}{' '}
                  {selectedCandidates.length === 1 ? 'specialist' : 'specialists'}
                </strong>{' '}
                for project &ldquo;
                <strong className="text-[var(--color-text-primary)] break-words">
                  {project.title}
                </strong>
                &rdquo;.
              </p>

              <div className="p-3.5 bg-[var(--color-surface-secondary)] rounded-[var(--radius-input)] border border-[var(--color-border)] space-y-2 text-xs">
                <span className="font-semibold text-[var(--color-text-primary)] block">
                  Client-Visible Finalists:
                </span>
                {selectedCandidates.map((c, i) => (
                  <div
                    key={c.professional.userId}
                    className="flex justify-between items-center gap-2 text-xs"
                  >
                    <span className="tabular-nums break-words text-[var(--color-text-secondary)]">
                      {i + 1}. {c.professional.displayName}
                      {recommendedProfId === c.professional.userId ? ' (Recommended)' : ''}
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)] shrink-0">
                      {c.quote
                        ? `€${(c.quote.amountMinor / 100).toLocaleString()} ${c.quote.currency}`
                        : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-[var(--color-success-bg)] text-[var(--color-success-text)] rounded-[var(--radius-input)] border border-[var(--color-success-border)] space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-success)] shrink-0" aria-hidden="true" />
                  <span>Client-Safe Data Boundary Verified:</span>
                </div>
                <ul className="list-disc list-inside text-xs space-y-0.5 leading-relaxed">
                  <li>Internal match scores and 6-dimension breakdowns are stripped.</li>
                  <li>Internal curator notes and override reasons remain admin-only.</li>
                  <li>Practitioners cannot view competing quotes or finalist identities.</li>
                  <li>
                    Project advances to <strong>Matches ready</strong> and notifies the client.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                size="sm"
                disabled={publishing}
                onClick={() => setShowPublishModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={publishing}
                onClick={handlePublishShortlist}
              >
                Confirm &amp; Publish
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
