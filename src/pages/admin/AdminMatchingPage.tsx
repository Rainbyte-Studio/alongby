import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { projectService } from '../../services/projectService';
import { matchingService } from '../../services/matchingService';
import { opportunityService } from '../../services/opportunityService';
import { quoteService } from '../../services/quoteService';
import { taxonomyService } from '../../services/taxonomyService';
import {
  Project,
  ProjectMatch,
  Opportunity,
  Quote,
  ScoreBreakdown,
} from '../../types';
import {
  ArrowLeft,
  Sparkles,
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Euro,
  Calendar,
  XCircle,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export const AdminMatchingPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [matches, setMatches] = useState<ProjectMatch[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningMatching, setRunningMatching] = useState(false);
  const [sendingOpportunityId, setSendingOpportunityId] = useState<string | null>(null);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [candidateToExclude, setCandidateToExclude] = useState<ProjectMatch | null>(null);
  const [excluding, setExcluding] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'eligible' | 'sent' | 'responded'>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const p = await projectService.getProject(projectId);
      if (!p) {
        setErrorMsg('Project not found.');
        return;
      }
      setProject(p);

      const [loadedMatches, loadedOpps, loadedQuotes] = await Promise.all([
        matchingService.getMatchesForProject(projectId),
        opportunityService.getOpportunitiesForProject(projectId),
        quoteService.getQuotesForProject(projectId),
      ]);

      setMatches(loadedMatches);
      setOpportunities(loadedOpps);
      setQuotes(loadedQuotes);

      // If no matches have been generated yet for a submitted or matching project, auto-run matching
      if (loadedMatches.length === 0 && (p.status === 'submitted' || p.status === 'matching') && currentUser) {
        try {
          const freshCandidates = await matchingService.runMatchingForProject(projectId, currentUser.uid);
          setMatches(freshCandidates);
          p.status = 'matching';
          setProject({ ...p });
        } catch (autoErr) {
          console.warn('Auto-run matching notice:', autoErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to load matching data:', err);
      setErrorMsg(err.message || 'Failed to load matching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleRunMatching = async () => {
    if (!projectId || !currentUser) return;
    try {
      setRunningMatching(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const candidates = await matchingService.runMatchingForProject(
        projectId,
        currentUser.uid,
        { maxCandidates: 10 }
      );

      setSuccessMsg(
        `Matching pipeline completed. ${candidates.length} candidates evaluated and saved.`
      );
      await loadData();
    } catch (err: any) {
      console.error('Error running matching:', err);
      setErrorMsg(err.message || 'Error executing matching pipeline.');
    } finally {
      setRunningMatching(false);
    }
  };

  const handleSendOpportunity = async (candidate: ProjectMatch) => {
    if (!projectId || !currentUser || sendingOpportunityId) return;
    try {
      setSendingOpportunityId(candidate.id);
      setErrorMsg(null);
      setSuccessMsg(null);

      await opportunityService.createOpportunity(
        projectId,
        candidate.professionalId,
        candidate.id,
        currentUser.uid,
        7 // 7 days expiry
      );

      setSuccessMsg(`Private opportunity successfully sent to ${candidate.professionalName}.`);
      await loadData();
    } catch (err: any) {
      console.error('Failed to send opportunity:', err);
      setErrorMsg(err.message || 'Failed to dispatch opportunity.');
    } finally {
      setSendingOpportunityId(null);
    }
  };

  const handleConfirmExclude = async () => {
    if (!projectId || !currentUser || !candidateToExclude || excluding) return;
    try {
      setExcluding(true);
      setErrorMsg(null);
      await matchingService.excludeMatchCandidate(projectId, candidateToExclude.id, currentUser.uid);
      setSuccessMsg(`${candidateToExclude.professionalName} excluded from this project's candidate pool.`);
      setCandidateToExclude(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to exclude candidate:', err);
      setErrorMsg(err.message || 'Failed to exclude candidate.');
    } finally {
      setExcluding(false);
    }
  };

  const getScoreDimensions = (candidate: ProjectMatch) => {
    const b = candidate.scoreBreakdown;
    return [
      {
        category: 'Service & Skills Fit',
        achieved: b.serviceAndSkills,
        max: 30,
        explanation:
          b.serviceAndSkills >= 30
            ? 'Primary service and required competencies strongly align.'
            : b.serviceAndSkills >= 20
            ? 'Service area aligns with relevant complementary technical capabilities.'
            : 'Core service matches with partial skill overlap.',
      },
      {
        category: 'Experience',
        achieved: b.relevantExperience,
        max: 20,
        explanation:
          b.relevantExperience >= 18
            ? 'Extensive verified professional track record in client delivery.'
            : b.relevantExperience >= 12
            ? 'Substantial proven delivery experience in commercial environments.'
            : 'Foundational verified experience in client delivery.',
      },
      {
        category: 'Availability',
        achieved: b.availability,
        max: 20,
        explanation:
          candidate.availabilityStatus === 'available'
            ? 'Available now for immediate client engagement kick-off.'
            : candidate.availabilityStatus === 'limited'
            ? 'Partially available with scheduling flexibility for project start.'
            : 'Upcoming availability aligning with project timeline.',
      },
      {
        category: 'Budget Fit',
        achieved: b.budgetFit,
        max: 15,
        explanation:
          b.budgetFit >= 15
            ? 'Client indicative budget fully accommodates professional baseline floor.'
            : b.budgetFit >= 10
            ? 'Commercial baseline is aligned with indicative project scope.'
            : 'Professional baseline floor is above indicative budget; alternative proposal may be requested.',
      },
      {
        category: 'Rating / Reliability',
        achieved: b.ratingReliability,
        max: 10,
        explanation:
          b.ratingReliability >= 8
            ? 'Strong verified platform reputation and consistent client satisfaction.'
            : 'Verified platform professional in good standing.',
      },
      {
        category: 'Workload / Capacity',
        achieved: b.workload,
        max: 5,
        explanation:
          b.workload >= 5
            ? 'Capacity permits dedicated, focused delivery attention.'
            : 'Balanced active commitments with confirmed capacity for this engagement.',
      },
    ];
  };

  if (loading) {
    return (
      <DashboardLayout title="Matching & Curation">
        <div className="py-24 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-xs text-neutral-500">Loading project matching candidates…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (errorMsg && !project) {
    return (
      <DashboardLayout title="Matching & Curation">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-neutral-900">{errorMsg}</h2>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            Back to Platform Admin
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) return null;

  const service = taxonomyService.getServiceCategoryById(project.serviceId);
  const projectType = service?.projectTypes.find((pt) => pt.id === project.projectTypeId);

  // Statistics
  const totalEvaluated = matches.length;
  const eligibleCount = matches.filter(
    (m) => m.eligibilityStatus === 'eligible' && m.status !== 'excluded' && m.status !== 'admin_removed'
  ).length;
  const oppsSentCount = matches.filter(
    (m) => m.status === 'opportunity_sent' || m.status === 'responded' || m.status === 'passed'
  ).length;
  const responsesCount = matches.filter((m) => m.status === 'responded').length;
  const passedCount = matches.filter((m) => m.status === 'passed').length;

  // Filtered list
  const filteredMatches = matches.filter((m) => {
    if (filterMode === 'eligible') {
      return m.eligibilityStatus === 'eligible' && m.status !== 'excluded' && m.status !== 'admin_removed';
    }
    if (filterMode === 'sent') return m.status === 'opportunity_sent';
    if (filterMode === 'responded') return m.status === 'responded';
    return true;
  });

  return (
    <DashboardLayout
      title={`Matching Review: ${project.title}`}
      subtitle={`Client: ${project.clientName || 'Client'} (${project.clientCompanyName || 'Company'}) • Project Status: ${project.status.replace(/_/g, ' ')}`}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Admin Dashboard
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={runningMatching}
            onClick={handleRunMatching}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {matches.length === 0 ? 'Run Matching Engine' : 'Re-run Matching (v1)'}
          </Button>
          <Link to={`/admin/projects/${project.id}/shortlist`}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5 text-stone-600" />}
            >
              Curated Shortlist Review
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Messages */}
        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-4">
              ×
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900 font-bold ml-4">
              ×
            </button>
          </div>
        )}

        {/* Project Context Card */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Service & Type
              </div>
              <div className="mt-1 font-semibold text-neutral-900 text-sm">
                {service?.name || project.serviceId}
              </div>
              <div className="text-xs text-neutral-500">
                {projectType?.name || project.projectTypeId}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Indicative Budget
              </div>
              <div className="mt-1 font-semibold text-neutral-900 text-sm flex items-center gap-1">
                <Euro className="w-3.5 h-3.5 text-neutral-500" />
                {project.brief.budget.budgetType === 'unsure' ? (
                  <span>Budget unspecified</span>
                ) : (
                  <span>
                    €{((project.brief.budget.minAmountMinor || 0) / 100).toLocaleString()} – €{((project.brief.budget.maxAmountMinor || 0) / 100).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500">Indicative range</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Target Timeline
              </div>
              <div className="mt-1 font-semibold text-neutral-900 text-sm flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>
                  Start: {project.brief.timeline.preferredStart.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-xs text-neutral-500">
                Flexibility: {project.brief.timeline.flexibility.replace(/_/g, ' ')}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Project State
              </div>
              <div className="mt-1">
                <Badge variant={project.status === 'awaiting_professional_responses' ? 'info' : 'warning'}>
                  {project.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="text-xs text-neutral-600 font-medium mt-1.5">
                Brief locked
              </div>
              <div className="text-[11px] text-neutral-400">
                Snapshot v{project.version || 1}
              </div>
            </div>
          </div>
        </Card>

        {/* Curation Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-4 text-center">
            <div className="text-xl font-serif font-bold text-neutral-900">{totalEvaluated}</div>
            <div className="text-[11px] text-neutral-500 font-medium">Evaluated</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xl font-serif font-bold text-neutral-900">{eligibleCount}</div>
            <div className="text-[11px] text-neutral-500 font-medium">Eligible Pool</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xl font-serif font-bold text-neutral-900">{oppsSentCount}</div>
            <div className="text-[11px] text-neutral-500 font-medium">Opportunities Sent</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xl font-serif font-bold text-emerald-600">{responsesCount}</div>
            <div className="text-[11px] text-neutral-500 font-medium">Quotes Received</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xl font-serif font-bold text-neutral-500">{passedCount}</div>
            <div className="text-[11px] text-neutral-500 font-medium">Passed / Declined</div>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-lg text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Recommendations ({matches.length})
            </button>
            <button
              onClick={() => setFilterMode('eligible')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterMode === 'eligible'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Eligible Only ({eligibleCount})
            </button>
            <button
              onClick={() => setFilterMode('sent')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterMode === 'sent'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Sent ({oppsSentCount})
            </button>
            <button
              onClick={() => setFilterMode('responded')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterMode === 'responded'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Responded ({responsesCount})
            </button>
          </div>

          <div className="text-xs text-neutral-500">
            Matching engine: <span className="font-semibold text-neutral-700">Alongby Match v1</span>{' '}
            <span className="text-[11px] text-neutral-400">(Deterministic)</span>
          </div>
        </div>

        {/* Candidates List */}
        {matches.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Matching algorithm not yet executed"
            description="Click 'Run Matching Engine' above to evaluate verified professionals against this project's service, timeline, and indicative budget requirements."
            action={{
              label: 'Run Matching Engine',
              onClick: handleRunMatching,
            }}
          />
        ) : filteredMatches.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No candidates match this filter"
            description="Switch to 'All Recommendations' to view all evaluated candidates."
          />
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((candidate) => {
              const isExpanded = expandedCandidateId === candidate.id;
              const isSending = sendingOpportunityId === candidate.id;
              const opp = opportunities.find((o) => o.matchId === candidate.id || o.id === candidate.opportunityId);
              const quote = quotes.find((q) => q.matchId === candidate.id || q.opportunityId === opp?.id);

              return (
                <Card
                  key={candidate.id}
                  className={`p-5 transition-shadow ${
                    candidate.eligibilityStatus === 'ineligible' || candidate.status === 'excluded' || candidate.status === 'admin_removed'
                      ? 'opacity-70 bg-neutral-50/70'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Professional Bio & Score */}
                    <div className="flex items-start gap-4">
                      {/* Score Circle */}
                      <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-neutral-900 text-white shadow-sm">
                        <span className="text-lg font-bold font-serif leading-none">
                          {candidate.matchScore}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">
                          Score
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-neutral-900 text-sm">
                            {candidate.professionalName}
                          </span>
                          <Badge
                            variant={candidate.eligibilityStatus === 'eligible' ? 'success' : 'neutral'}
                          >
                            {candidate.eligibilityStatus === 'eligible' ? 'Eligible' : 'Ineligible'}
                          </Badge>

                          {(candidate.status === 'excluded' || candidate.status === 'admin_removed') && (
                            <Badge variant="neutral">Excluded</Badge>
                          )}
                          {candidate.status === 'opportunity_sent' && (
                            <Badge variant="info">Opportunity Sent</Badge>
                          )}
                          {candidate.status === 'responded' && (
                            <Badge variant="success">Quote Responded</Badge>
                          )}
                          {candidate.status === 'passed' && (
                            <Badge variant="neutral">Passed</Badge>
                          )}
                        </div>

                        <div className="text-xs font-medium text-neutral-700">
                          {candidate.professionalTitle}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-neutral-400" />
                            {candidate.professionalCountry} ({candidate.professionalTimezone})
                          </span>
                          <span>•</span>
                          <span>
                            Availability: <strong className="text-neutral-700">{candidate.availabilityStatus}</strong> (Next: {candidate.nextAvailableDate})
                          </span>
                          <span>•</span>
                          <span>
                            Floor: €{(candidate.minimumBudgetMinor / 100).toLocaleString()} EUR
                          </span>
                        </div>

                        {/* Chips for match reasons */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {candidate.matchReasons?.slice(0, 3).map((r, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-medium"
                            >
                              ✓ {r}
                            </span>
                          ))}
                        </div>

                        {/* Ineligibility or warning notices */}
                        {candidate.eligibilityReasons && candidate.eligibilityReasons.length > 0 && (
                          <div className="pt-1 text-[11px] text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Ineligibility factor: {candidate.eligibilityReasons.join('; ')}</span>
                          </div>
                        )}
                        {candidate.warnings && candidate.warnings.length > 0 && (
                          <div className="pt-0.5 text-[11px] text-amber-600 flex items-center gap-1">
                            <Info className="w-3 h-3 shrink-0" />
                            <span>Warning: {candidate.warnings.join('; ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="shrink-0 flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-neutral-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedCandidateId(isExpanded ? null : candidate.id)
                        }
                        rightIcon={
                          isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {isExpanded ? 'Hide Breakdown' : 'Score Details'}
                      </Button>

                      {quote && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedQuote(quote)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View Quote (€{(quote.amountMinor / 100).toLocaleString()})
                        </Button>
                      )}

                      {candidate.status === 'candidate' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={isSending}
                            disabled={isSending || !!sendingOpportunityId || candidate.eligibilityStatus !== 'eligible'}
                            onClick={() => handleSendOpportunity(candidate)}
                            leftIcon={<Send className="w-3.5 h-3.5" />}
                          >
                            Send Opportunity
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCandidateToExclude(candidate)}
                            className="text-neutral-400 hover:text-rose-600"
                          >
                            Exclude
                          </Button>
                        </>
                      )}

                      {(candidate.status === 'excluded' || candidate.status === 'admin_removed') && (
                        <div className="text-right">
                          <span className="text-xs font-medium text-neutral-500 block">
                            Excluded from candidate pool
                          </span>
                          <span className="text-[10px] text-neutral-400 block">
                            {candidate.excludedAt
                              ? `Excluded on ${new Date(candidate.excludedAt).toLocaleDateString()}`
                              : 'Removed by Admin'}
                          </span>
                        </div>
                      )}

                      {candidate.status === 'opportunity_sent' && opp && (
                        <div className="text-right">
                          <span className="text-[11px] text-neutral-500 block">
                            Sent on {new Date(opp.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-neutral-400 block">
                            Expires {new Date(opp.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Score Breakdown Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-neutral-100 bg-neutral-50/80 p-4 rounded-xl space-y-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        Score Breakdown Details
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {getScoreDimensions(candidate).map((dim, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white rounded-lg border border-neutral-200/80 shadow-2xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-neutral-900">
                                {dim.category}
                              </span>
                              <span className="text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded font-mono">
                                {dim.achieved} / {dim.max}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-600 leading-relaxed">
                              {dim.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Quote Inspection Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 bg-white shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 font-serif">
                    {selectedQuote.quoteType === 'alternative'
                      ? 'Alternative Commercial Proposal'
                      : 'Commercial Quote Submission'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Submitted on {new Date(selectedQuote.submittedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-neutral-50 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-neutral-500 block">Total Proposed Amount</span>
                    <span className="text-2xl font-serif font-bold text-neutral-900">
                      €{(selectedQuote.amountMinor / 100).toLocaleString()} {selectedQuote.currency}
                    </span>
                  </div>
                  <Badge
                    variant={
                      selectedQuote.budgetRelation === 'within_budget'
                        ? 'success'
                        : selectedQuote.budgetRelation === 'slightly_above'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {selectedQuote.budgetRelation.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {selectedQuote.quoteType === 'alternative' && selectedQuote.alternativeExplanation && (
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong className="block mb-1">Alternative Proposal Justification:</strong>
                    <p className="leading-relaxed">{selectedQuote.alternativeExplanation}</p>
                  </div>
                )}

                <div>
                  <span className="text-xs font-bold text-neutral-700 block mb-1">Scope Delivery Summary</span>
                  <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-md leading-relaxed whitespace-pre-wrap">
                    {selectedQuote.scopeSummary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-400 block">Target Kick-off Date</span>
                    <span className="font-semibold text-neutral-800">{selectedQuote.proposedStartDate}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Estimated Duration</span>
                    <span className="font-semibold text-neutral-800">{selectedQuote.estimatedDurationDays} days</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Revisions Included</span>
                    <span className="font-semibold text-neutral-800">{selectedQuote.revisionsIncluded}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Status</span>
                    <span className="font-semibold text-neutral-800 uppercase">{selectedQuote.status}</span>
                  </div>
                </div>

                {selectedQuote.includedItems && selectedQuote.includedItems.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-neutral-700 block mb-1">Inclusions</span>
                    <ul className="list-disc list-inside text-xs text-neutral-600 space-y-0.5">
                      {selectedQuote.includedItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedQuote.excludedItems && selectedQuote.excludedItems.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-neutral-700 block mb-1">Exclusions</span>
                    <ul className="list-disc list-inside text-xs text-neutral-600 space-y-0.5">
                      {selectedQuote.excludedItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedQuote(null)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Exclude Professional Confirmation Modal */}
        {candidateToExclude && (
          <Modal
            isOpen={!!candidateToExclude}
            onClose={() => {
              if (!excluding) setCandidateToExclude(null);
            }}
            title="Exclude this professional?"
            description="They will be removed from this project's candidate pool. This will not affect their profile or eligibility for other projects."
            maxWidth="md"
          >
            <div className="space-y-4 pt-1">
              <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-900 block text-sm">
                    {candidateToExclude.professionalName}
                  </span>
                  <span className="text-neutral-500">
                    {candidateToExclude.professionalTitle} • Match Score: {candidateToExclude.matchScore}
                  </span>
                </div>
                <Badge variant={candidateToExclude.eligibilityStatus === 'eligible' ? 'success' : 'neutral'}>
                  {candidateToExclude.eligibilityStatus === 'eligible' ? 'Eligible' : 'Ineligible'}
                </Badge>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed">
                Exclusion is specific to this project brief only. Their profile, account standing, and eligibility for future project opportunities remain fully active.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={excluding}
                  onClick={() => setCandidateToExclude(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={excluding}
                  onClick={handleConfirmExclude}
                  className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                >
                  Exclude Professional
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};
