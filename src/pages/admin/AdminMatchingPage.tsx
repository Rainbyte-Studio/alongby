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
  Euro,
  Calendar,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Eye,
  X,
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
          <p className="mt-4 text-xs text-[var(--color-text-muted)]">Loading project matching candidates…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (errorMsg && !project) {
    return (
      <DashboardLayout title="Matching & Curation">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[var(--color-error)] mx-auto" />
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">{errorMsg}</h2>
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
        <div className="flex flex-wrap items-center gap-2">
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
              leftIcon={<FileText className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />}
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
          <div className="p-3.5 rounded-[var(--radius-input)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-xs text-[var(--color-success-text)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded text-[var(--color-success-text)] hover:bg-black/5 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-[var(--radius-input)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-xs text-[var(--color-error-text)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-[var(--color-error)] shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              aria-label="Dismiss error"
              className="p-1 rounded text-[var(--color-error-text)] hover:bg-black/5 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Project Context Card */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Service & Type
              </div>
              <div className="mt-1 font-semibold text-[var(--color-text-primary)] text-sm">
                {service?.name || project.serviceId}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                {projectType?.name || project.projectTypeId}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Indicative Budget
              </div>
              <div className="mt-1 font-semibold tabular-nums text-[var(--color-text-primary)] text-sm flex items-center gap-1">
                <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                {project.brief.budget.budgetType === 'unsure' ? (
                  <span>Budget unspecified</span>
                ) : (
                  <span>
                    €{((project.brief.budget.minAmountMinor || 0) / 100).toLocaleString()} – €{((project.brief.budget.maxAmountMinor || 0) / 100).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">Indicative range</div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Target Timeline
              </div>
              <div className="mt-1 font-semibold text-[var(--color-text-primary)] text-sm flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                <span>
                  Start: {project.brief.timeline.preferredStart.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                Flexibility: {project.brief.timeline.flexibility.replace(/_/g, ' ')}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Project State
              </div>
              <div className="mt-1">
                <Badge variant={project.status === 'awaiting_professional_responses' ? 'info' : 'warning'}>
                  {project.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] font-medium mt-1.5">
                Brief locked
              </div>
              <div className="text-xs text-[var(--color-text-muted)] tabular-nums">
                Snapshot v{project.version || 1}
              </div>
            </div>
          </div>
        </Card>

        {/* Curation Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-4 text-center">
            <div className="text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">{totalEvaluated}</div>
            <div className="text-xs text-[var(--color-text-secondary)] font-medium mt-0.5">Evaluated</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">{eligibleCount}</div>
            <div className="text-xs text-[var(--color-text-secondary)] font-medium mt-0.5">Eligible Pool</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">{oppsSentCount}</div>
            <div className="text-xs text-[var(--color-text-secondary)] font-medium mt-0.5">Opportunities Sent</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-sans font-bold tabular-nums text-[var(--color-success)]">{responsesCount}</div>
            <div className="text-xs text-[var(--color-text-secondary)] font-medium mt-0.5">Quotes Received</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-sans font-bold tabular-nums text-[var(--color-text-secondary)]">{passedCount}</div>
            <div className="text-xs text-[var(--color-text-secondary)] font-medium mt-0.5">Passed / Declined</div>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div
            role="tablist"
            aria-label="Filter matching candidates"
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
              All Recommendations ({matches.length})
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
              Eligible Only ({eligibleCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === 'sent'}
              onClick={() => setFilterMode('sent')}
              className={`px-3 py-1.5 rounded-[6px] font-medium tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                filterMode === 'sent'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-2xs border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
              }`}
            >
              Sent ({oppsSentCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === 'responded'}
              onClick={() => setFilterMode('responded')}
              className={`px-3 py-1.5 rounded-[6px] font-medium tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                filterMode === 'responded'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-2xs border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
              }`}
            >
              Responded ({responsesCount})
            </button>
          </div>

          <div className="text-xs text-[var(--color-text-secondary)]">
            Matching engine: <span className="font-semibold text-[var(--color-text-primary)]">Alongby Match v1</span>{' '}
            <span className="text-xs text-[var(--color-text-muted)]">(Deterministic)</span>
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
                  className={`p-5 transition-colors ${
                    candidate.eligibilityStatus === 'ineligible' || candidate.status === 'excluded' || candidate.status === 'admin_removed'
                      ? 'opacity-75 bg-[var(--color-surface-secondary)]/60'
                      : 'bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Professional Bio & Score */}
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Score Badge */}
                      <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-[var(--radius-card)] bg-[var(--color-primary)] text-[var(--color-primary-text)]">
                        <span className="text-lg font-sans font-bold tabular-nums leading-none">
                          {candidate.matchScore}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-white/75 mt-0.5">
                          Score
                        </span>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="typo-card-title text-[var(--color-text-primary)] break-words">
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

                        <div className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                          {candidate.professionalTitle}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--color-text-muted)] tabular-nums">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[var(--color-text-muted)]" />
                            {candidate.professionalCountry} ({candidate.professionalTimezone})
                          </span>
                          <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                          <span>
                            Availability: <strong className="font-semibold text-[var(--color-text-primary)]">{candidate.availabilityStatus}</strong> (Next: {candidate.nextAvailableDate})
                          </span>
                          <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            Floor: €{(candidate.minimumBudgetMinor / 100).toLocaleString()} EUR
                          </span>
                        </div>

                        {/* Match reasons */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {candidate.matchReasons?.slice(0, 3).map((r, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-0.5 rounded-[6px] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium"
                            >
                              ✓ {r}
                            </span>
                          ))}
                        </div>

                        {/* Ineligibility or warning notices */}
                        {candidate.eligibilityReasons && candidate.eligibilityReasons.length > 0 && (
                          <div className="pt-1 text-xs text-[var(--color-error-text)] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Ineligibility factor: {candidate.eligibilityReasons.join('; ')}</span>
                          </div>
                        )}
                        {candidate.warnings && candidate.warnings.length > 0 && (
                          <div className="pt-0.5 text-xs text-[var(--color-warning-text)] flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>Warning: {candidate.warnings.join('; ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="shrink-0 flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-[var(--color-border)]">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-expanded={isExpanded}
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
                          className="tabular-nums"
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
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)]"
                          >
                            Exclude
                          </Button>
                        </>
                      )}

                      {(candidate.status === 'excluded' || candidate.status === 'admin_removed') && (
                        <div className="text-right">
                          <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                            Excluded from candidate pool
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)] tabular-nums block">
                            {candidate.excludedAt
                              ? `Excluded on ${new Date(candidate.excludedAt).toLocaleDateString()}`
                              : 'Removed by Admin'}
                          </span>
                        </div>
                      )}

                      {candidate.status === 'opportunity_sent' && opp && (
                        <div className="text-right">
                          <span className="text-xs text-[var(--color-text-secondary)] tabular-nums block">
                            Sent on {new Date(opp.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)] tabular-nums block">
                            Expires {new Date(opp.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Score Breakdown Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4 rounded-[var(--radius-input)] space-y-3">
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                        Score Breakdown Details
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {getScoreDimensions(candidate).map((dim, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-[var(--color-surface)] rounded-[var(--radius-input)] border border-[var(--color-border)] space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                                {dim.category}
                              </span>
                              <span className="text-xs font-sans font-semibold tabular-nums text-[var(--color-text-primary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-2 py-0.5 rounded">
                                {dim.achieved} / {dim.max}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
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
        <Modal
          isOpen={!!selectedQuote}
          onClose={() => setSelectedQuote(null)}
          title={
            selectedQuote?.quoteType === 'alternative'
              ? 'Alternative Commercial Proposal'
              : 'Commercial Quote Submission'
          }
          description={
            selectedQuote
              ? `Submitted on ${new Date(selectedQuote.submittedAt).toLocaleString()}`
              : undefined
          }
          maxWidth="lg"
        >
          {selectedQuote && (
            <div className="space-y-4">
              <div className="p-4 rounded-[var(--radius-input)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-baseline justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-[var(--color-text-muted)] block">Total Proposed Amount</span>
                  <span className="text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
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
                <div className="p-3.5 rounded-[var(--radius-input)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-xs text-[var(--color-warning-text)]">
                  <strong className="font-semibold block mb-1">Alternative Proposal Justification:</strong>
                  <p className="leading-relaxed">{selectedQuote.alternativeExplanation}</p>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">Scope Delivery Summary</span>
                <p className="text-[13px] text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] p-3 rounded-[var(--radius-input)] leading-relaxed whitespace-pre-wrap">
                  {selectedQuote.scopeSummary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[var(--color-text-muted)] font-medium block">Target Kick-off Date</span>
                  <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">{selectedQuote.proposedStartDate}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] font-medium block">Estimated Duration</span>
                  <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">{selectedQuote.estimatedDurationDays} days</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] font-medium block">Revisions Included</span>
                  <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">{selectedQuote.revisionsIncluded}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] font-medium block">Status</span>
                  <span className="font-semibold text-[var(--color-text-primary)] uppercase">{selectedQuote.status}</span>
                </div>
              </div>

              {selectedQuote.includedItems && selectedQuote.includedItems.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">Inclusions</span>
                  <ul className="list-disc list-inside text-xs text-[var(--color-text-secondary)] space-y-0.5">
                    {selectedQuote.includedItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedQuote.excludedItems && selectedQuote.excludedItems.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">Exclusions</span>
                  <ul className="list-disc list-inside text-xs text-[var(--color-text-secondary)] space-y-0.5">
                    {selectedQuote.excludedItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedQuote(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

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
              <div className="p-3.5 rounded-[var(--radius-input)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-[var(--color-text-primary)] block text-sm break-words">
                    {candidateToExclude.professionalName}
                  </span>
                  <span className="text-[var(--color-text-secondary)] tabular-nums">
                    {candidateToExclude.professionalTitle} · Match Score: {candidateToExclude.matchScore}
                  </span>
                </div>
                <Badge variant={candidateToExclude.eligibilityStatus === 'eligible' ? 'success' : 'neutral'}>
                  {candidateToExclude.eligibilityStatus === 'eligible' ? 'Eligible' : 'Ineligible'}
                </Badge>
              </div>

              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Exclusion is specific to this project brief only. Their profile, account standing, and eligibility for future project opportunities remain fully active.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={excluding}
                  onClick={() => setCandidateToExclude(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  isLoading={excluding}
                  onClick={handleConfirmExclude}
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
