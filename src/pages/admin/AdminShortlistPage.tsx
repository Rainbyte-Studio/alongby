import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { projectService } from '../../services/projectService';
import {
  shortlistService,
  EvaluatedCandidateRecord,
  SHORTLIST_CONFIG,
} from '../../services/shortlistService';
import { matchExplanationService } from '../../services/matchExplanationService';
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
  Sparkles,
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

  const loadData = async () => {
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
        // Pre-select top 2-3 eligible candidates
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
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

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
          setErrorMsg(`Maximum shortlist size is ${SHORTLIST_CONFIG.maxSize} professionals. Please remove one before adding another.`);
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
      setSuccessMsg('Shortlist draft saved successfully.');
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

      // Save latest state first
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

      // Publish
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
      setSuccessMsg('Curated shortlist published! The client has been notified and can now review and select a professional.');
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
      <DashboardLayout role="admin">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-[var(--color-text-muted)] font-sans">Loading shortlist evaluation records...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="admin">
        <EmptyState
          title="Project not found"
          description="The requested project could not be found."
          action={{
            label: 'Back to Projects',
            onClick: () => navigate('/admin/projects'),
          }}
        />
      </DashboardLayout>
    );
  }

  const selectedCandidates = selectedCandidateIds
    .map((id) => candidates.find((c) => c.professional.userId === id))
    .filter(Boolean) as EvaluatedCandidateRecord[];

  const eligibleCandidatesCount = candidates.filter((c) => c.eligibility.eligible).length;

  const filteredCandidates = candidates.filter((c) => {
    if (filterMode === 'eligible') return c.eligibility.eligible;
    if (filterMode === 'shortlisted') return selectedCandidateIds.includes(c.professional.userId);
    return true;
  });

  const isShortlistPublished = project.status === 'shortlist_ready' || project.status === 'professional_selected';

  return (
    <DashboardLayout role="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
              <Link to="/admin/projects" className="hover:text-[var(--color-text-primary)] transition-colors">Projects</Link>
              <span className="text-[var(--color-border-strong)]" aria-hidden="true">/</span>
              <Link to={`/admin/projects/${project.id}`} className="hover:text-[var(--color-text-primary)] transition-colors break-words">
                {project.title}
              </Link>
              <span className="text-[var(--color-border-strong)]" aria-hidden="true">/</span>
              <span className="text-[var(--color-text-secondary)]">Shortlist Review</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="typo-page-title text-[var(--color-text-primary)]">
                Curated Shortlist Review
              </h1>
              {isShortlistPublished ? (
                <Badge variant="success" size="md">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Published to Client
                </Badge>
              ) : (
                <Badge variant="outline" size="md">
                  Drafting Shortlist
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/admin/projects/${project.id}/matching`}>
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Matching Engine
              </Button>
            </Link>
            <Link to={`/admin/projects/${project.id}`}>
              <Button variant="outline" size="sm">
                Project Detail
              </Button>
            </Link>
          </div>
        </div>

        {/* Notifications / Alerts */}
        {successMsg && (
          <div className="p-4 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-[var(--radius-input)] text-sm text-[var(--color-success-text)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              aria-label="Dismiss notification"
              className="text-[var(--color-success-text)] hover:bg-black/5 text-xs font-medium px-2 py-1 rounded cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-[var(--radius-input)] text-sm text-[var(--color-error-text)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-5 h-5 text-[var(--color-error)] shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              aria-label="Dismiss error"
              className="text-[var(--color-error-text)] hover:bg-black/5 text-xs font-medium px-2 py-1 rounded cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Project Context Strip */}
        <Card className="p-5 bg-[var(--color-surface-secondary)] border-[var(--color-border)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
            <div>
              <span className="text-[var(--color-text-muted)] font-medium uppercase tracking-wider block mb-1">Client</span>
              <span className="font-semibold text-[var(--color-text-primary)] text-sm break-words">
                {project.clientName || 'Private Client'}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] font-medium uppercase tracking-wider block mb-1">Service & Category</span>
              <span className="font-semibold text-[var(--color-text-primary)] text-sm capitalize">
                {project.serviceId?.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] font-medium uppercase tracking-wider block mb-1">Indicative Budget</span>
              <span className="font-semibold tabular-nums text-[var(--color-text-primary)] text-sm">
                {project.brief?.indicativeBudget
                  ? `${(project.brief.indicativeBudget.amountMinor / 100).toLocaleString()} ${project.brief.indicativeBudget.currency}`
                  : 'Flexible'}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] font-medium uppercase tracking-wider block mb-1">Response Pool</span>
              <span className="font-semibold tabular-nums text-[var(--color-text-primary)] text-sm">
                {candidates.length} Responded ({eligibleCandidatesCount} Eligible)
              </span>
            </div>
          </div>
        </Card>

        {/* Published Shortlist Status (if published) */}
        {publishedShortlist && (
          <Card className="p-6 border-[var(--color-success-border)] bg-[var(--color-success-bg)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0" />
                  <h3 className="typo-section-heading text-[var(--color-success-text)]">
                    Curated Shortlist Live for Client Review
                  </h3>
                </div>
                <p className="text-xs text-[var(--color-success-text)] max-w-2xl font-sans tabular-nums leading-relaxed">
                  Published on {new Date(publishedShortlist.publishedAt).toLocaleString()} with {publishedShortlist.candidates.length} verified professional candidates. The client can compare quotes and select their preferred partner.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/client/projects/${project.id}/matches`} target="_blank">
                  <Button variant="white" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                    Preview Client View
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Shortlist Curation Command Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Candidate Evaluation Cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter / Tabs */}
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
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-2xs border border-[var(--color-border)]'
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
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-2xs border border-[var(--color-border)]'
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
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-2xs border border-[var(--color-border)]'
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
                  filterMode === 'eligible'
                    ? 'No candidates currently satisfy all automated eligibility criteria.'
                    : 'No responses match the active filter.'
                }
              />
            ) : (
              filteredCandidates.map((cand) => {
                const isSelected = selectedCandidateIds.includes(cand.professional.userId);
                const isRecommended = recommendedProfId === cand.professional.userId;
                const isExpanded = expandedCandidateId === cand.professional.userId;
                const quote = cand.quote;
                const clientExplanation = matchExplanationService.generateClientSafeExplanation(
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
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)]/50'
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
                              <h3 className="typo-card-title text-[var(--color-text-primary)] break-words">
                                {cand.professional.displayName}
                              </h3>
                              <Badge variant="outline" size="sm">
                                <ShieldCheck className="w-3 h-3 mr-1 text-[var(--color-success)]" />
                                Verified
                              </Badge>
                              {cand.eligibility.eligible ? (
                                <Badge variant="success" size="sm">
                                  Eligible
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  Ineligible
                                </Badge>
                              )}
                              {isRecommended && (
                                <Badge variant="warning" size="sm">
                                  <Star className="w-3 h-3 mr-1 fill-[var(--color-warning)] text-[var(--color-warning)]" />
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] font-sans tabular-nums mt-0.5">
                              {cand.professional.professionalTitle} · {cand.professional.country} · {cand.professional.yearsOfExperience} yrs exp
                            </p>
                          </div>
                        </div>

                        {/* Internal Match Score & Action Button */}
                        <div className="flex items-center gap-2 sm:self-start shrink-0">
                          <div className="text-right mr-2 hidden sm:block">
                            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase block">Match</span>
                            <span className="text-sm font-bold font-sans tabular-nums text-[var(--color-text-primary)]">
                              {cand.match.matchScore}
                              <span className="text-[var(--color-text-muted)] font-normal text-xs">/100</span>
                            </span>
                          </div>

                          <Button
                            variant={isSelected ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleCandidate(cand.professional.userId)}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-4 h-4 mr-1 text-[var(--color-success)]" />
                                Shortlisted
                              </>
                            ) : (
                              'Add to Shortlist'
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Commercial Proposal Summary */}
                      {quote && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[var(--color-surface)] rounded-[var(--radius-input)] border border-[var(--color-border)] text-xs">
                          <div>
                            <span className="text-[var(--color-text-muted)] font-medium block mb-0.5">Quote Amount</span>
                            <span className="font-bold tabular-nums text-[var(--color-text-primary)] text-sm">
                              {(quote.amountMinor / 100).toLocaleString()} {quote.currency}
                            </span>
                            {quote.quoteType === 'alternative' && (
                              <span className="text-[11px] text-[var(--color-warning-text)] font-medium block">
                                (Alternative Proposal)
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)] font-medium block mb-0.5">Kickoff & Turnaround</span>
                            <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
                              {quote.proposedStartDate || 'Immediate'} ({quote.estimatedDurationDays}d)
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)] font-medium block mb-0.5">Inclusions</span>
                            <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
                              {quote.includedItems?.length || 0} items ({quote.revisionsIncluded} revisions)
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)] font-medium block mb-0.5">Budget Fit</span>
                            <span
                              className={`font-medium ${
                                quote.budgetRelation === 'within_budget'
                                  ? 'text-[var(--color-success-text)]'
                                  : quote.budgetRelation === 'slightly_above'
                                  ? 'text-[var(--color-warning-text)]'
                                  : 'text-[var(--color-error-text)]'
                              }`}
                            >
                              {quote.budgetRelation.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Client-Safe Explanation Preview */}
                      <div className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-input)] text-xs font-sans text-[var(--color-text-secondary)]">
                        <span className="font-semibold text-[var(--color-text-primary)] block mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                          Client-Safe Match Narrative (Zero Raw Scores):
                        </span>
                        <p className="italic text-[var(--color-text-secondary)]">"{clientExplanation}"</p>
                      </div>

                      {/* Eligibility & Warnings details */}
                      {(!cand.eligibility.eligible || cand.eligibility.warnings.length > 0) && (
                        <div className="space-y-1.5 text-xs">
                          {!cand.eligibility.eligible && (
                            <div className="flex items-start gap-2 text-[var(--color-error-text)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] p-2.5 rounded-[var(--radius-input)]">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-error)]" />
                              <div>
                                <span className="font-semibold">Ineligibility Reasons:</span>
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
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-warning)]" />
                              <div>
                                <span className="font-semibold">Curator Warnings:</span>
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
                      <div className="pt-1">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedCandidateId(isExpanded ? null : cand.professional.userId)}
                          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 font-medium cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              Hide Scope & Proposal Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              Inspect Complete Commercial Scope & Terms
                            </>
                          )}
                        </button>

                        {isExpanded && quote && (
                          <div className="mt-3 p-4 bg-[var(--color-surface)] rounded-[var(--radius-input)] border border-[var(--color-border)] space-y-3 text-xs">
                            <div>
                              <span className="font-semibold text-[var(--color-text-primary)] block mb-1">Scope Summary:</span>
                              <p className="text-[var(--color-text-secondary)] leading-relaxed">{quote.scopeSummary}</p>
                            </div>

                            {quote.includedItems && quote.includedItems.length > 0 && (
                              <div>
                                <span className="font-semibold text-[var(--color-text-primary)] block mb-1">Included Deliverables:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-[var(--color-text-secondary)]">
                                  {quote.includedItems.map((inc, i) => (
                                    <li key={i}>{inc}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {quote.excludedItems && quote.excludedItems.length > 0 && (
                              <div>
                                <span className="font-semibold text-[var(--color-text-primary)] block mb-1">Explicit Exclusions:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-[var(--color-text-secondary)]">
                                  {quote.excludedItems.map((exc, i) => (
                                    <li key={i}>{exc}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {quote.note && (
                              <div>
                                <span className="font-semibold text-[var(--color-text-primary)] block mb-1">Professional Note:</span>
                                <p className="text-[var(--color-text-secondary)]">{quote.note}</p>
                              </div>
                            )}

                            {quote.alternativeExplanation && (
                              <div className="p-2.5 bg-[var(--color-warning-bg)] rounded-[var(--radius-input)] border border-[var(--color-warning-border)]">
                                <span className="font-semibold text-[var(--color-warning-text)] block mb-1">Alternative Scope Rationale:</span>
                                <p className="text-[var(--color-warning-text)]">{quote.alternativeExplanation}</p>
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

          {/* Right Col: Shortlist Basket & Publication Controls */}
          <div className="space-y-6">
            <Card className="p-5 border-[var(--color-border-strong)] bg-[var(--color-surface)] sticky top-6">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4 gap-2">
                <div>
                  <h3 className="typo-section-heading text-[var(--color-text-primary)]">
                    Curated Finalists
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] font-sans">
                    Ordered presentation for client comparison
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
                  {selectedCandidateIds.length} of {SHORTLIST_CONFIG.minimumSize}–{SHORTLIST_CONFIG.maxSize}
                </Badge>
              </div>

              {/* Selected List */}
              {selectedCandidates.length === 0 ? (
                <div className="p-6 border border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-card)] text-center">
                  <Layers className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
                  <p className="text-xs text-[var(--color-text-muted)] font-sans leading-relaxed">
                    No professionals added to the shortlist yet. Select 2–3 eligible professionals from the candidate responses.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mb-5">
                  {selectedCandidates.map((cand, idx) => {
                    const isRec = recommendedProfId === cand.professional.userId;
                    return (
                      <div
                        key={cand.professional.userId}
                        className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-input)] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] flex items-center justify-center font-sans font-semibold tabular-nums text-[11px] shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-[var(--color-text-primary)] truncate block">
                              {cand.professional.displayName}
                            </span>
                            <span className="text-xs text-[var(--color-text-secondary)] tabular-nums truncate block">
                              {cand.quote
                                ? `${(cand.quote.amountMinor / 100).toLocaleString()} ${cand.quote.currency}`
                                : 'No quote'}
                              {isRec && ' · Recommended'}
                            </span>
                          </div>
                        </div>

                        {/* Reorder and Recommendation tools */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            title="Move Up"
                            aria-label={`Move ${cand.professional.displayName} up`}
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(cand.professional.userId, 'up')}
                            className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            aria-label={`Move ${cand.professional.displayName} down`}
                            disabled={idx === selectedCandidates.length - 1}
                            onClick={() => handleMoveOrder(cand.professional.userId, 'down')}
                            className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title={isRec ? 'Remove recommendation' : 'Mark as Recommended finalist'}
                            aria-label={isRec ? `Remove recommendation from ${cand.professional.displayName}` : `Mark ${cand.professional.displayName} as recommended`}
                            onClick={() => {
                              if (isRec) {
                                setRecommendedProfId(undefined);
                                setRecommendationRationale('');
                              } else {
                                setRecommendedProfId(cand.professional.userId);
                                setRecommendationRationale('Strong balance of verified domain delivery and timeline alignment.');
                              }
                            }}
                            className={`p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                              isRec ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-warning)]'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isRec ? 'fill-[var(--color-warning)]' : ''}`} />
                          </button>
                          <button
                            type="button"
                            title="Remove from shortlist"
                            aria-label={`Remove ${cand.professional.displayName} from shortlist`}
                            onClick={() => handleToggleCandidate(cand.professional.userId)}
                            className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-error-text)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recommendation Rationale Input */}
              {recommendedProfId && (
                <div className="mb-4 p-3 bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] rounded-[var(--radius-input)] text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-warning-text)]">
                    <Star className="w-3.5 h-3.5 fill-[var(--color-warning)] text-[var(--color-warning)]" />
                    Recommendation Highlight:
                  </div>
                  <input
                    type="text"
                    value={recommendationRationale}
                    onChange={(e) => setRecommendationRationale(e.target.value)}
                    placeholder="E.g. Best overall value and direct Shopify Plus portfolio"
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-warning-border)] rounded-[var(--radius-input)] text-sm font-normal text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)]"
                  />
                </div>
              )}

              {/* Admin Internal Notes */}
              <div className="mb-4 space-y-1.5">
                <label className="text-[13px] font-medium text-[var(--color-text-primary)] block">
                  Curator Internal Notes (Admin Only):
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes on client budget alignment, candidate vetting, etc."
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-[var(--radius-input)] text-sm font-normal text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)]"
                />
              </div>

              {/* Admin Override for Size Constraints (<2 candidates) */}
              {selectedCandidateIds.length < SHORTLIST_CONFIG.minimumSize && (
                <div className="mb-4 p-3 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-[var(--radius-input)] text-xs space-y-2">
                  <div className="flex items-start gap-1.5 text-[var(--color-error-text)]">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-error)]" />
                    <span>
                      Standard curation requires at least {SHORTLIST_CONFIG.minimumSize} professionals for meaningful client comparison.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={overrideApplied}
                      onChange={(e) => setOverrideApplied(e.target.checked)}
                      className="rounded border-[var(--color-error-border)] accent-[var(--color-primary)]"
                    />
                    <span className="text-[13px] font-medium text-[var(--color-error-text)]">Apply Administrator Override</span>
                  </label>
                  {overrideApplied && (
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Mandatory justification (e.g., highly specialized niche)"
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-error-border)] rounded-[var(--radius-input)] text-sm font-normal text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)]"
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
                  loading={savingDraft}
                  onClick={handleSaveDraft}
                >
                  Save Draft Shortlist
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
          title="Publish Shortlist to Client"
          description="Final verification before client release"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="space-y-3 text-sm text-[var(--color-text-secondary)] font-sans">
              <p className="leading-relaxed">
                You are about to publish a curated shortlist of{' '}
                <strong className="text-[var(--color-text-primary)] tabular-nums">{selectedCandidates.length} professionals</strong>{' '}
                for project &ldquo;<strong className="text-[var(--color-text-primary)] break-words">{project.title}</strong>&rdquo;.
              </p>

              <div className="p-3 bg-[var(--color-surface-secondary)] rounded-[var(--radius-input)] border border-[var(--color-border)] space-y-2 text-xs">
                <span className="font-semibold text-[var(--color-text-primary)] block">Shortlisted Finalists:</span>
                {selectedCandidates.map((c, i) => (
                  <div key={c.professional.userId} className="flex justify-between items-center gap-2 text-xs">
                    <span className="tabular-nums break-words text-[var(--color-text-secondary)]">
                      {i + 1}. {c.professional.displayName}
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)] shrink-0">
                      {c.quote ? `${(c.quote.amountMinor / 100).toLocaleString()} ${c.quote.currency}` : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[var(--color-success-bg)] text-[var(--color-success-text)] rounded-[var(--radius-input)] border border-[var(--color-success-border)] space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                  Strict Data Protection Verified:
                </div>
                <ul className="list-disc list-inside text-xs space-y-0.5 leading-relaxed">
                  <li>Raw match scores (e.g. 94%) are permanently stripped.</li>
                  <li>Professionals cannot see competitor identities, quotes, or proposals.</li>
                  <li>Project status transitions to <span className="font-sans font-semibold">shortlist_ready</span>.</li>
                  <li>Client will immediately receive an in-app notification to review.</li>
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
                loading={publishing}
                onClick={handlePublishShortlist}
              >
                Confirm & Publish
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
