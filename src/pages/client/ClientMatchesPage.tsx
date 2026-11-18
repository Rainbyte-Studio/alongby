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
import { shortlistService } from '../../services/shortlistService';
import { proposalService } from '../../services/proposalService';
import {
  Project,
  PublishedShortlist,
  ShortlistCandidateSnapshot,
  ProfessionalSelection,
} from '../../types';
import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  Star,
  Check,
  X,
  FileText,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  HelpCircle,
  ArrowRight,
  Send,
  Building2,
  MapPin,
  Globe,
} from 'lucide-react';

export const ClientMatchesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [shortlist, setShortlist] = useState<PublishedShortlist | null>(null);
  const [selection, setSelection] = useState<ProfessionalSelection | null>(null);
  const [loading, setLoading] = useState(true);

  // Interaction state
  const [inspectCandidate, setInspectCandidate] = useState<ShortlistCandidateSnapshot | null>(null);
  const [candidateToSelect, setCandidateToSelect] = useState<ShortlistCandidateSnapshot | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const [projData, pubShortlist, selRecord] = await Promise.all([
        projectService.getProject(projectId),
        shortlistService.getPublishedShortlist(projectId),
        shortlistService.getSelection(projectId),
      ]);

      setProject(projData);
      setShortlist(pubShortlist);
      setSelection(selRecord);
    } catch (err: any) {
      console.error('Failed to load client matches:', err);
      setErrorMsg(err?.message || 'Failed to load your curated matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleConfirmSelection = async () => {
    if (!project || !candidateToSelect || !currentUser) return;
    try {
      setSelecting(true);
      setErrorMsg(null);

      const result = await shortlistService.selectProfessional(
        project.id,
        candidateToSelect.professionalId,
        currentUser.uid,
        currentUser.displayName || project.clientName
      );

      setSelection(result);
      setCandidateToSelect(null);
      setInspectCandidate(null);
      setSuccessMsg(`Selection confirmed! You have selected ${candidateToSelect.professional.displayName}.`);

      // Automatically initialize Proposal v1 in background
      try {
        await proposalService.initializeProposalFromSelection(project.id, currentUser.uid);
      } catch (propErr) {
        console.warn('Could not auto-initialize proposal:', propErr);
      }

      loadData();
    } catch (err: any) {
      console.error('Failed to select professional:', err);
      setErrorMsg(err?.message || 'Failed to confirm selection. Please try again.');
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="client">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-stone-500 font-sans">
            Curating your personalized professional presentation...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (userProfile?.role === 'professional') {
    return (
      <DashboardLayout role="professional">
        <EmptyState
          title="Access Denied"
          description="Curated match comparison is only accessible to clients."
          action={{
            label: 'Go to Dashboard',
            onClick: () => navigate('/professional/dashboard'),
          }}
        />
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="client">
        <EmptyState
          title="Project not found"
          description="The requested project brief could not be located."
          action={{
            label: 'Back to Projects',
            onClick: () => navigate('/client/projects'),
          }}
        />
      </DashboardLayout>
    );
  }

  // Security authorization guard: only owner or admin can view matches
  if (currentUser && project.clientId !== currentUser.uid && userProfile?.role !== 'admin') {
    return (
      <DashboardLayout role="client">
        <EmptyState
          title="Access Denied"
          description="You do not have permission to view curated matches for this project."
          action={{
            label: 'Back to My Projects',
            onClick: () => navigate('/client/projects'),
          }}
        />
      </DashboardLayout>
    );
  }

  // If shortlist is not yet published by admin
  if (!shortlist || shortlist.candidates.length === 0) {
    return (
      <DashboardLayout role="client">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            to={`/client/projects/${project.id}`}
            className="inline-flex items-center text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Project Brief
          </Link>

          <Card className="p-8 text-center space-y-4 border-stone-200 bg-white">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-serif text-stone-900">
              We are currently vetting and curating your matches
            </h2>
            <p className="text-sm text-stone-600 max-w-lg mx-auto font-sans leading-relaxed">
              Our curation team is currently vetting professional responses, checking real-time capacity, and verifying customized quotes for "<strong>{project.title}</strong>".
            </p>
            <div className="p-4 bg-stone-50 rounded-xl max-w-md mx-auto border border-stone-200 text-xs text-stone-600 text-left space-y-2">
              <span className="font-semibold text-stone-800 block">The Alongby Difference:</span>
              <p>You won't receive a generic public marketplace directory with hundreds of cold pitches. Instead, you'll receive a tailored, side-by-side comparison of 2–3 verified specialists with guaranteed availability and fixed commercial terms.</p>
            </div>
            <div className="pt-2">
              <Link to={`/client/projects/${project.id}`}>
                <Button variant="outline" size="sm">
                  View Project Status
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isSelectionMade = Boolean(selection || shortlist.selectedProfessionalId);
  const selectedProfId = selection?.professionalId || shortlist.selectedProfessionalId;

  return (
    <DashboardLayout role="client">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              to={`/client/projects/${project.id}`}
              className="inline-flex items-center text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Project Brief
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif text-stone-900 tracking-tight">
                Curated Professional Matches
              </h1>
              {isSelectionMade ? (
                <Badge variant="success" size="md">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Professional Selected
                </Badge>
              ) : (
                <Badge variant="outline" size="md">
                  {shortlist.candidates.length} Vetted Specialists
                </Badge>
              )}
            </div>
            <p className="text-sm text-stone-600 font-sans mt-1">
              Review and compare quotes from verified specialists hand-selected for "<strong>{project.title}</strong>".
            </p>
          </div>

          <Link to={`/client/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              Project Overview
            </Button>
          </Link>
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

        {/* Selection Banner if Selection Made */}
        {isSelectionMade && (
          <Card className="p-6 border-emerald-300 bg-emerald-50/70 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-serif text-lg font-medium text-emerald-950">
                    Professional Selection Confirmed
                  </h2>
                </div>
                <p className="text-xs text-emerald-800 font-sans max-w-2xl leading-relaxed">
                  You selected{' '}
                  <strong>
                    {selection?.selectionSnapshot?.professionalName || 'the specialist'}
                  </strong>{' '}
                  for a total commercial proposal of{' '}
                  <strong>
                    {selection?.selectionSnapshot
                      ? `${(selection.selectionSnapshot.amountMinor / 100).toLocaleString()} ${selection.selectionSnapshot.currency}`
                      : 'the submitted quote'}
                  </strong>
                  . Our team is now generating your formal project agreement and setting up milestone staged payment protection.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link to={`/client/projects/${project.id}/proposal`}>
                  <Button variant="primary" size="sm">
                    Review Commercial Proposal
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Curated 2–3 Candidates Comparison Deck */}
        <div
          className={`grid grid-cols-1 ${
            shortlist.candidates.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
          } gap-6 items-stretch`}
        >
          {shortlist.candidates.map((cand, idx) => {
            const isSelected = selectedProfId === cand.professionalId;
            const isRec = cand.isRecommended;

            return (
              <Card
                key={cand.professionalId}
                className={`p-6 flex flex-col justify-between transition-all relative ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                    : isRec
                    ? 'border-amber-400/80 bg-white shadow-md'
                    : 'border-stone-200 bg-white hover:border-stone-300 shadow-sm'
                }`}
              >
                {/* Ribbon for Recommended or Selected */}
                {isSelected ? (
                  <div className="absolute -top-3 left-6">
                    <span className="bg-emerald-700 text-white text-[11px] font-medium px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Check className="w-3 h-3" />
                      Selected Partner
                    </span>
                  </div>
                ) : isRec ? (
                  <div className="absolute -top-3 left-6">
                    <span className="bg-stone-900 text-amber-300 text-[11px] font-medium px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                      Alongby Recommended
                    </span>
                  </div>
                ) : null}

                <div className="space-y-5">
                  {/* Professional Header */}
                  <div className="pt-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center font-serif text-lg flex-shrink-0">
                        {cand.professional.displayName?.charAt(0) || 'P'}
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" size="sm">
                          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                          Verified
                        </Badge>
                        <span className="text-[11px] text-stone-400 font-sans mt-1">
                          Option {idx + 1} of {shortlist.candidates.length}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-xl font-serif text-stone-900 font-medium tracking-tight">
                        {cand.professional.displayName}
                      </h3>
                      <p className="text-xs text-stone-500 font-sans mt-0.5">
                        {cand.professional.professionalTitle}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-stone-400 font-sans mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {cand.professional.country}
                        </span>
                        <span>•</span>
                        <span>{cand.professional.yearsOfExperience}+ yrs exp</span>
                        {cand.professional.completedProjectCount ? (
                          <>
                            <span>•</span>
                            <span>{cand.professional.completedProjectCount} projects</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Why We Matched You (Clean, natural explanation, strictly NO raw scores) */}
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 text-xs space-y-1.5">
                    <span className="font-semibold text-stone-900 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-stone-600" />
                      Why we matched you:
                    </span>
                    <p className="text-stone-600 leading-relaxed font-sans">
                      {cand.clientSafeMatchReason}
                    </p>
                  </div>

                  {/* Recommendation Rationale if provided */}
                  {isRec && cand.recommendationRationale && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900">
                      <span className="font-semibold block mb-0.5">Curator Note:</span>
                      <p className="text-amber-800">{cand.recommendationRationale}</p>
                    </div>
                  )}

                  {/* Commercial Quote Summary */}
                  <div className="p-4 bg-stone-50/50 rounded-xl border border-stone-200/70 space-y-3">
                    <div className="flex items-baseline justify-between border-b border-stone-200 pb-2">
                      <span className="text-xs text-stone-500 font-sans uppercase tracking-wider">
                        Total Commercial Quote
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-serif font-semibold text-stone-900">
                          {(cand.quote.amountMinor / 100).toLocaleString()} {cand.quote.currency}
                        </span>
                        {cand.quote.quoteType === 'alternative' && (
                          <span className="text-[10px] text-amber-700 font-medium block">
                            (Custom Alternative Scope)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          Starts:{' '}
                          <strong className="text-stone-800">
                            {cand.quote.proposedStartDate || 'On confirmation'}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          Timeline:{' '}
                          <strong className="text-stone-800">
                            {cand.quote.estimatedDurationDays} days
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Highlights bullets */}
                    {cand.keyMatchHighlights && cand.keyMatchHighlights.length > 0 && (
                      <div className="pt-1 space-y-1">
                        {cand.keyMatchHighlights.map((hl, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-stone-600 font-sans">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{hl}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Included Deliverables preview */}
                  {cand.quote.includedItems && cand.quote.includedItems.length > 0 && (
                    <div className="space-y-1.5 text-xs font-sans">
                      <span className="font-semibold text-stone-800 block">Scope Inclusions:</span>
                      <ul className="space-y-1 text-stone-600">
                        {cand.quote.includedItems.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-stone-400 font-mono">•</span>
                            <span className="line-clamp-1">{item}</span>
                          </li>
                        ))}
                        {cand.quote.includedItems.length > 3 && (
                          <li className="text-[11px] text-stone-400 font-medium pl-3">
                            + {cand.quote.includedItems.length - 3} more deliverables
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-6 mt-6 border-t border-stone-200 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setInspectCandidate(cand)}
                  >
                    View Full Proposal & Portfolio
                  </Button>

                  {!isSelectionMade ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => setCandidateToSelect(cand)}
                    >
                      Select {cand.professional.displayName.split(' ')[0]}
                    </Button>
                  ) : isSelected ? (
                    <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-lg text-center text-xs font-medium flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Confirmed Selection
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Detailed Inspection Modal */}
        {inspectCandidate && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <Card className="max-w-3xl w-full p-6 sm:p-8 bg-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-stone-200 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center font-serif text-2xl flex-shrink-0">
                    {inspectCandidate.professional.displayName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-serif text-stone-900 font-medium">
                        {inspectCandidate.professional.displayName}
                      </h2>
                      <Badge variant="outline" size="sm">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Verified Specialist
                      </Badge>
                      {inspectCandidate.isRecommended && (
                        <Badge variant="warning" size="sm">
                          <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-stone-600 font-sans mt-0.5">
                      {inspectCandidate.professional.professionalTitle} • {inspectCandidate.professional.country} ({inspectCandidate.professional.timezone})
                    </p>
                    <div className="flex items-center gap-3 text-xs text-stone-400 font-sans mt-1">
                      <span>{inspectCandidate.professional.yearsOfExperience}+ Years Experience</span>
                      {inspectCandidate.professional.languages && (
                        <>
                          <span>•</span>
                          <span>Languages: {inspectCandidate.professional.languages.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setInspectCandidate(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Professional Bio */}
              {inspectCandidate.professional.shortBio && (
                <div className="space-y-1.5 text-xs text-stone-700 font-sans">
                  <span className="font-semibold text-stone-900 block">About Specialist:</span>
                  <p className="leading-relaxed">{inspectCandidate.professional.shortBio}</p>
                </div>
              )}

              {/* Skills & Core Disciplines */}
              {inspectCandidate.professional.skills && inspectCandidate.professional.skills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-stone-900 block font-sans">Core Skills & Tools:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectCandidate.professional.skills.map((skill, i) => (
                      <Badge key={i} variant="outline" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Why We Matched You Narrative */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-stone-600" />
                  Curator Match Evaluation:
                </span>
                <p className="text-stone-600 leading-relaxed font-sans">
                  {inspectCandidate.clientSafeMatchReason}
                </p>
                {inspectCandidate.recommendationRationale && (
                  <p className="text-amber-800 pt-1 font-medium">
                    Curator Note: {inspectCandidate.recommendationRationale}
                  </p>
                )}
              </div>

              {/* Commercial Terms & Quote Details */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="text-base font-serif font-medium text-stone-900">
                      Commercial Proposal & Schedule
                    </h3>
                    <span className="text-xs text-stone-500 font-sans">
                      Fixed-scope proposal prepared for your project
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-serif font-bold text-stone-900">
                      {(inspectCandidate.quote.amountMinor / 100).toLocaleString()}{' '}
                      {inspectCandidate.quote.currency}
                    </span>
                    {inspectCandidate.quote.quoteType === 'alternative' && (
                      <span className="text-xs text-amber-700 font-medium block">
                        (Custom Alternative Scope)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-700 font-sans">
                  <div className="p-3 bg-white rounded-lg border border-stone-200">
                    <span className="text-stone-400 block mb-0.5">Kickoff Readiness</span>
                    <span className="font-medium text-stone-900">
                      {inspectCandidate.quote.proposedStartDate || 'Upon agreement signing'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-stone-200">
                    <span className="text-stone-400 block mb-0.5">Estimated Duration</span>
                    <span className="font-medium text-stone-900">
                      {inspectCandidate.quote.estimatedDurationDays} calendar days
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-stone-200">
                    <span className="text-stone-400 block mb-0.5">Revision Rounds</span>
                    <span className="font-medium text-stone-900">
                      {inspectCandidate.quote.revisionsIncluded} rounds included
                    </span>
                  </div>
                </div>

                {/* Scope Summary */}
                <div className="space-y-1 text-xs text-stone-700 font-sans">
                  <span className="font-semibold text-stone-900 block">Scope Summary:</span>
                  <p className="leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
                    {inspectCandidate.quote.scopeSummary}
                  </p>
                </div>

                {/* Inclusions & Exclusions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  {inspectCandidate.quote.includedItems && inspectCandidate.quote.includedItems.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Explicitly Included:
                      </span>
                      <ul className="space-y-1 text-stone-600 bg-white p-3 rounded-lg border border-stone-200">
                        {inspectCandidate.quote.includedItems.map((inc, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-mono">✓</span>
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {inspectCandidate.quote.excludedItems && inspectCandidate.quote.excludedItems.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5 text-stone-400" />
                        Explicitly Excluded:
                      </span>
                      <ul className="space-y-1 text-stone-600 bg-white p-3 rounded-lg border border-stone-200">
                        {inspectCandidate.quote.excludedItems.map((exc, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-stone-400 font-mono">✕</span>
                            <span>{exc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Alternative Explanation if provided */}
                {inspectCandidate.quote.alternativeExplanation && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-1">
                    <span className="font-semibold text-amber-900 block">Alternative Proposal Rationale:</span>
                    <p className="text-amber-800 leading-relaxed">
                      {inspectCandidate.quote.alternativeExplanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Portfolio / Relevant Past Work Items */}
              {inspectCandidate.professional.portfolioItems &&
                inspectCandidate.professional.portfolioItems.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-serif text-base font-medium text-stone-900">
                      Featured Past Work
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {inspectCandidate.professional.portfolioItems.map((item, i) => (
                        <div key={i} className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-stone-900">{item.title}</span>
                            {item.year && <span className="text-stone-400 font-mono">{item.year}</span>}
                          </div>
                          <p className="text-stone-600 leading-relaxed line-clamp-2">{item.description}</p>
                          {item.liveUrl && (
                            <a
                              href={item.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-stone-800 hover:text-stone-950 font-medium inline-flex items-center gap-1 mt-1"
                            >
                              View Live Work <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectCandidate(null)}
                >
                  Close Inspection
                </Button>

                {!isSelectionMade && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setCandidateToSelect(inspectCandidate);
                      setInspectCandidate(null);
                    }}
                  >
                    Select {inspectCandidate.professional.displayName}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Selection Confirmation Modal */}
        {candidateToSelect && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <Card className="max-w-lg w-full p-6 sm:p-8 bg-white shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-stone-900">
                    Confirm Professional Selection
                  </h3>
                  <p className="text-xs text-stone-500 font-sans">
                    Finalize your chosen partner for {project.title}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-stone-700 font-sans leading-relaxed">
                <p>
                  You are selecting <strong>{candidateToSelect.professional.displayName}</strong> as your verified specialist partner.
                </p>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-stone-500">Fixed Proposal Amount:</span>
                    <span className="font-serif text-lg font-bold text-stone-900">
                      {(candidateToSelect.quote.amountMinor / 100).toLocaleString()}{' '}
                      {candidateToSelect.quote.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Estimated Turnaround:</span>
                    <span className="font-medium text-stone-800">
                      {candidateToSelect.quote.estimatedDurationDays} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Commencement:</span>
                    <span className="font-medium text-stone-800">
                      {candidateToSelect.quote.proposedStartDate || 'Upon agreement signing'}
                    </span>
                  </div>

                  {candidateToSelect.quote.scopeSummary && (
                    <div className="pt-2 border-t border-stone-200">
                      <span className="text-stone-500 font-medium block mb-1">Scope of Work:</span>
                      <p className="bg-white p-2.5 rounded-lg border border-stone-200 text-stone-700 leading-relaxed max-h-24 overflow-y-auto">
                        {candidateToSelect.quote.scopeSummary}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                  <span className="font-semibold block flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    What happens next:
                  </span>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-emerald-800">
                    <li>The specialist is immediately notified of your selection.</li>
                    <li>The Alongby team prepares your formal project agreement with milestone protection.</li>
                    <li>No payment is charged right now. Staged deposits apply only upon contract signing.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selecting}
                  onClick={() => setCandidateToSelect(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  loading={selecting}
                  onClick={handleConfirmSelection}
                >
                  Confirm Selection
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
