import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
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
  Calendar,
  Clock,
  Euro,
  FileText,
  AlertCircle,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Sparkles,
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
          <p className="mt-4 text-sm text-stone-500 font-sans">Loading shortlist evaluation records...</p>
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
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-400 mb-1">
              <Link to="/admin/projects" className="hover:text-stone-700 transition-colors">Projects</Link>
              <span>/</span>
              <Link to={`/admin/projects/${project.id}`} className="hover:text-stone-700 transition-colors">
                {project.title}
              </Link>
              <span>/</span>
              <span className="text-stone-700">Shortlist Review</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif text-stone-900 tracking-tight">
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

          <div className="flex items-center gap-2">
            <Link to={`/admin/projects/${project.id}/matching`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
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
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs">
              Dismiss
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800 text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Project Context Strip */}
        <Card className="p-5 bg-stone-50 border-stone-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
            <div>
              <span className="text-stone-400 uppercase tracking-wider block mb-1">Client</span>
              <span className="font-medium text-stone-800 text-sm">
                {project.clientName || 'Private Client'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 uppercase tracking-wider block mb-1">Service & Category</span>
              <span className="font-medium text-stone-800 text-sm capitalize">
                {project.serviceId?.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-stone-400 uppercase tracking-wider block mb-1">Indicative Budget</span>
              <span className="font-medium text-stone-800 text-sm">
                {project.brief?.indicativeBudget
                  ? `${(project.brief.indicativeBudget.amountMinor / 100).toLocaleString()} ${project.brief.indicativeBudget.currency}`
                  : 'Flexible'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 uppercase tracking-wider block mb-1">Response Pool</span>
              <span className="font-medium text-stone-800 text-sm">
                {candidates.length} Responded ({eligibleCandidatesCount} Eligible)
              </span>
            </div>
          </div>
        </Card>

        {/* Published Shortlist Status (if published) */}
        {publishedShortlist && (
          <Card className="p-6 border-emerald-200 bg-emerald-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-serif text-lg text-emerald-950 font-medium">
                    Curated Shortlist Live for Client Review
                  </h3>
                </div>
                <p className="text-xs text-emerald-800 max-w-2xl font-sans">
                  Published on {new Date(publishedShortlist.publishedAt).toLocaleString()} with {publishedShortlist.candidates.length} verified professional candidates. The client can compare quotes and select their preferred partner.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/client/projects/${project.id}/matches`} target="_blank">
                  <Button variant="outline" size="sm" className="bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50">
                    <Eye className="w-4 h-4 mr-1.5" />
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
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterMode === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  All Responses ({candidates.length})
                </button>
                <button
                  onClick={() => setFilterMode('eligible')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterMode === 'eligible'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Eligible ({eligibleCandidatesCount})
                </button>
                <button
                  onClick={() => setFilterMode('shortlisted')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterMode === 'shortlisted'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  In Shortlist ({selectedCandidateIds.length})
                </button>
              </div>
              <span className="text-xs text-stone-400 font-mono">
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
                    className={`p-5 transition-all ${
                      isSelected
                        ? 'border-stone-900 bg-stone-50/40 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      {/* Candidate Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center font-serif text-lg flex-shrink-0">
                            {cand.professional.displayName?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-serif text-stone-900 font-medium">
                                {cand.professional.displayName}
                              </h3>
                              <Badge variant="outline" size="sm">
                                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
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
                                  <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 font-sans mt-0.5">
                              {cand.professional.professionalTitle} • {cand.professional.country} • {cand.professional.yearsOfExperience} yrs exp
                            </p>
                          </div>
                        </div>

                        {/* Internal Match Score & Action Button */}
                        <div className="flex items-center gap-2 sm:self-start">
                          <div className="text-right mr-2 hidden sm:block">
                            <span className="text-xs text-stone-400 font-mono uppercase block">Match</span>
                            <span className="text-sm font-semibold font-mono text-stone-900">
                              {cand.match.matchScore}
                              <span className="text-stone-400 font-normal text-xs">/100</span>
                            </span>
                          </div>

                          <Button
                            variant={isSelected ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleCandidate(cand.professional.userId)}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-4 h-4 mr-1 text-emerald-600" />
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
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-lg border border-stone-200/80 text-xs">
                          <div>
                            <span className="text-stone-400 block mb-0.5">Quote Amount</span>
                            <span className="font-semibold text-stone-900 text-sm">
                              {(quote.amountMinor / 100).toLocaleString()} {quote.currency}
                            </span>
                            {quote.quoteType === 'alternative' && (
                              <span className="text-[10px] text-amber-700 font-medium block">
                                (Alternative Proposal)
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-stone-400 block mb-0.5">Kickoff & Turnaround</span>
                            <span className="font-medium text-stone-800">
                              {quote.proposedStartDate || 'Immediate'} ({quote.estimatedDurationDays}d)
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 block mb-0.5">Inclusions</span>
                            <span className="font-medium text-stone-800">
                              {quote.includedItems?.length || 0} items ({quote.revisionsIncluded} revisions)
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 block mb-0.5">Budget Fit</span>
                            <span
                              className={`font-medium ${
                                quote.budgetRelation === 'within_budget'
                                  ? 'text-emerald-700'
                                  : quote.budgetRelation === 'slightly_above'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {quote.budgetRelation.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Client-Safe Explanation Preview */}
                      <div className="p-3 bg-stone-100/70 rounded-lg text-xs font-sans text-stone-700">
                        <span className="font-semibold text-stone-900 block mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-stone-600" />
                          Client-Safe Match Narrative (Zero Raw Scores):
                        </span>
                        <p className="italic text-stone-600">"{clientExplanation}"</p>
                      </div>

                      {/* Eligibility & Warnings details */}
                      {(!cand.eligibility.eligible || cand.eligibility.warnings.length > 0) && (
                        <div className="space-y-1 text-xs">
                          {!cand.eligibility.eligible && (
                            <div className="flex items-start gap-1.5 text-rose-700 bg-rose-50 p-2 rounded">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-medium">Ineligibility Reasons:</span>
                                <ul className="list-disc list-inside mt-0.5">
                                  {cand.eligibility.reasons.map((r, i) => (
                                    <li key={i}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                          {cand.eligibility.warnings.length > 0 && (
                            <div className="flex items-start gap-1.5 text-amber-700 bg-amber-50 p-2 rounded">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-medium">Curator Warnings:</span>
                                <ul className="list-disc list-inside mt-0.5">
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
                          onClick={() => setExpandedCandidateId(isExpanded ? null : cand.professional.userId)}
                          className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium"
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
                          <div className="mt-3 p-4 bg-white rounded-lg border border-stone-200 space-y-3 text-xs">
                            <div>
                              <span className="font-medium text-stone-900 block mb-1">Scope Summary:</span>
                              <p className="text-stone-600 leading-relaxed">{quote.scopeSummary}</p>
                            </div>

                            {quote.includedItems && quote.includedItems.length > 0 && (
                              <div>
                                <span className="font-medium text-stone-900 block mb-1">Included Deliverables:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                                  {quote.includedItems.map((inc, i) => (
                                    <li key={i}>{inc}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {quote.excludedItems && quote.excludedItems.length > 0 && (
                              <div>
                                <span className="font-medium text-stone-900 block mb-1">Explicit Exclusions:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                                  {quote.excludedItems.map((exc, i) => (
                                    <li key={i}>{exc}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {quote.note && (
                              <div>
                                <span className="font-medium text-stone-900 block mb-1">Professional Note:</span>
                                <p className="text-stone-600">{quote.note}</p>
                              </div>
                            )}

                            {quote.alternativeExplanation && (
                              <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
                                <span className="font-medium text-amber-900 block mb-1">Alternative Scope Rationale:</span>
                                <p className="text-amber-800">{quote.alternativeExplanation}</p>
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
            <Card className="p-5 border-stone-300 bg-white sticky top-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
                <div>
                  <h3 className="font-serif text-lg font-medium text-stone-900">
                    Curated Finalists
                  </h3>
                  <p className="text-xs text-stone-500 font-sans">
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
                >
                  {selectedCandidateIds.length} of {SHORTLIST_CONFIG.minimumSize}–{SHORTLIST_CONFIG.maxSize}
                </Badge>
              </div>

              {/* Selected List */}
              {selectedCandidates.length === 0 ? (
                <div className="p-6 border border-dashed border-stone-200 rounded-xl text-center">
                  <Layers className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs text-stone-500 font-sans">
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
                        className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center font-mono text-[10px] flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-medium text-xs text-stone-900 truncate block">
                              {cand.professional.displayName}
                            </span>
                            <span className="text-[11px] text-stone-500 truncate block">
                              {cand.quote
                                ? `${(cand.quote.amountMinor / 100).toLocaleString()} ${cand.quote.currency}`
                                : 'No quote'}
                              {isRec && ' • Recommended'}
                            </span>
                          </div>
                        </div>

                        {/* Reorder and Recommendation tools */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            title="Move Up"
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(cand.professional.userId, 'up')}
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Move Down"
                            disabled={idx === selectedCandidates.length - 1}
                            onClick={() => handleMoveOrder(cand.professional.userId, 'down')}
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title={isRec ? 'Remove recommendation' : 'Mark as Recommended finalist'}
                            onClick={() => {
                              if (isRec) {
                                setRecommendedProfId(undefined);
                                setRecommendationRationale('');
                              } else {
                                setRecommendedProfId(cand.professional.userId);
                                setRecommendationRationale('Strong balance of verified domain delivery and timeline alignment.');
                              }
                            }}
                            className={`p-1 rounded ${
                              isRec ? 'text-amber-600' : 'text-stone-400 hover:text-amber-600'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isRec ? 'fill-amber-500' : ''}`} />
                          </button>
                          <button
                            title="Remove from shortlist"
                            onClick={() => handleToggleCandidate(cand.professional.userId)}
                            className="p-1 text-stone-400 hover:text-rose-600 text-xs font-mono"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recommendation Rationale Input */}
              {recommendedProfId && (
                <div className="mb-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center gap-1 font-medium text-amber-900">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    Recommendation Highlight:
                  </div>
                  <input
                    type="text"
                    value={recommendationRationale}
                    onChange={(e) => setRecommendationRationale(e.target.value)}
                    placeholder="E.g. Best overall value and direct Shopify Plus portfolio"
                    className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded text-xs text-stone-800 focus:outline-none"
                  />
                </div>
              )}

              {/* Admin Internal Notes */}
              <div className="mb-4 text-xs space-y-1.5">
                <label className="font-medium text-stone-700 block">
                  Curator Internal Notes (Admin Only):
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes on client budget alignment, candidate vetting, etc."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:border-stone-400"
                />
              </div>

              {/* Admin Override for Size Constraints (<2 candidates) */}
              {selectedCandidateIds.length < SHORTLIST_CONFIG.minimumSize && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-start gap-1.5 text-rose-800">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Standard curation requires at least {SHORTLIST_CONFIG.minimumSize} professionals for meaningful client comparison.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={overrideApplied}
                      onChange={(e) => setOverrideApplied(e.target.checked)}
                      className="rounded border-rose-300 text-rose-600"
                    />
                    <span className="font-medium text-rose-900">Apply Administrator Override</span>
                  </label>
                  {overrideApplied && (
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Mandatory justification (e.g., highly specialized niche)"
                      className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded text-xs text-stone-800 focus:outline-none"
                    />
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
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
                >
                  <Send className="w-4 h-4 mr-1.5" />
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
        {showPublishModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <Card className="max-w-lg w-full p-6 bg-white shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
                <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-900">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-stone-900">
                    Publish Shortlist to Client
                  </h3>
                  <p className="text-xs text-stone-500 font-sans">
                    Final verification before client release
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-stone-700 font-sans">
                <p>
                  You are about to publish a curated shortlist of <strong>{selectedCandidates.length} professionals</strong> for project "<strong>{project.title}</strong>".
                </p>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <span className="font-medium text-stone-900 block">Shortlisted Finalists:</span>
                  {selectedCandidates.map((c, i) => (
                    <div key={c.professional.userId} className="flex justify-between items-center text-xs">
                      <span>{i + 1}. {c.professional.displayName}</span>
                      <span className="font-mono text-stone-600">
                        {c.quote ? `${(c.quote.amountMinor / 100).toLocaleString()} ${c.quote.currency}` : ''}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Strict Data Protection Verified:
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-emerald-900">
                    <li>Raw match scores (e.g. 94%) are permanently stripped.</li>
                    <li>Professionals cannot see competitor identities, quotes, or proposals.</li>
                    <li>Project status transitions to <code>shortlist_ready</code>.</li>
                    <li>Client will immediately receive an in-app notification to review.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
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
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
