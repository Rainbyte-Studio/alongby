import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { projectService } from '../../services/projectService';
import { matchingService } from '../../services/matchingService';
import { opportunityService } from '../../services/opportunityService';
import { quoteService } from '../../services/quoteService';
import { taxonomyService } from '../../services/taxonomyService';
import {
  formatProjectBudget,
  formatTimelineOption,
  getAdminProjectStatusDisplay,
  getBudgetRelationDisplay,
} from '../../utils/statusMapping';
import {
  Project,
  ProjectMatch,
  Opportunity,
  Quote,
} from '../../types';
import {
  SlidersHorizontal,
  Users,
  Send,
  AlertCircle,
  Euro,
  Calendar,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Eye,
  Lock,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
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

      if (
        loadedMatches.length === 0 &&
        (p.status === 'submitted' || p.status === 'matching') &&
        currentUser
      ) {
        try {
          const freshCandidates = await matchingService.runMatchingForProject(
            projectId,
            currentUser.uid
          );
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
  }, [projectId, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        `Matching evaluation completed. ${candidates.length} candidates evaluated and saved.`
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
        7
      );

      setSuccessMsg(`Private opportunity dispatched to ${candidate.professionalName}.`);
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
      await matchingService.excludeMatchCandidate(
        projectId,
        candidateToExclude.id,
        currentUser.uid
      );
      setSuccessMsg(
        `${candidateToExclude.professionalName} excluded from this project's candidate pool.`
      );
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
            ? 'Client indicative budget accommodates practitioner baseline floor.'
            : b.budgetFit >= 10
            ? 'Commercial baseline is aligned with indicative project scope.'
            : 'Baseline floor is above indicative budget; alternative proposal may be submitted.',
      },
      {
        category: 'Rating & Reliability',
        achieved: b.ratingReliability,
        max: 10,
        explanation:
          b.ratingReliability >= 8
            ? 'Strong verified platform track record and client satisfaction.'
            : 'Verified practitioner in good standing.',
      },
      {
        category: 'Workload & Capacity',
        achieved: b.workload,
        max: 5,
        explanation:
          b.workload >= 5
            ? 'Capacity permits dedicated, focused delivery attention.'
            : 'Balanced active commitments with confirmed capacity.',
      },
    ];
  };

  const budgetRanges = taxonomyService.getBudgetRanges('EUR');
  const lookupRangeLabel = (id: string) => budgetRanges.find((r) => r.id === id)?.label;

  const totalEvaluated = matches.length;
  const eligibleCount = matches.filter(
    (m) =>
      m.eligibilityStatus === 'eligible' &&
      m.status !== 'excluded' &&
      m.status !== 'admin_removed'
  ).length;
  const oppsSentCount = matches.filter(
    (m) =>
      m.status === 'opportunity_sent' ||
      m.status === 'responded' ||
      m.status === 'passed'
  ).length;
  const responsesCount = matches.filter((m) => m.status === 'responded').length;
  const passedCount = matches.filter((m) => m.status === 'passed').length;

  const filteredMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return matches.filter((m) => {
      if (filterMode === 'eligible') {
        if (
          !(
            m.eligibilityStatus === 'eligible' &&
            m.status !== 'excluded' &&
            m.status !== 'admin_removed'
          )
        ) {
          return false;
        }
      } else if (filterMode === 'sent') {
        if (
          !(
            m.status === 'opportunity_sent' ||
            m.status === 'responded' ||
            m.status === 'passed'
          )
        ) {
          return false;
        }
      } else if (filterMode === 'responded') {
        if (m.status !== 'responded') return false;
      }

      if (q) {
        return (
          (m.professionalName || '').toLowerCase().includes(q) ||
          (m.professionalTitle || '').toLowerCase().includes(q) ||
          (m.professionalCountry || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [matches, filterMode, searchQuery]);

  if (loading) {
    return (
      <DashboardLayout title="Matching & Curation">
        <div className="py-24 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            Loading candidate evaluation records…
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (errorMsg && !project) {
    return (
      <DashboardLayout title="Matching & Curation">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[var(--color-error)] mx-auto" aria-hidden="true" />
          <h2 className="typo-section-heading text-[var(--color-text-primary)]">{errorMsg}</h2>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            Back to Operations Console
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) return null;

  const service = taxonomyService.getServiceCategoryById(project.serviceId);
  const projectType = service?.projectTypes.find((pt) => pt.id === project.projectTypeId);
  const adminStatus = getAdminProjectStatusDisplay(project.status);

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Operations Console', to: '/admin' },
        { label: project.title || 'Project', to: `/client/projects/${project.id}` },
        { label: 'Matching & Dispatch' },
      ]}
      title={`Matching Review: ${project.title}`}
      subtitle={`Client: ${project.clientName || 'Client'}${
        project.clientCompanyName ? ` (${project.clientCompanyName})` : ''
      }`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={runningMatching}
            onClick={handleRunMatching}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            {matches.length === 0 ? 'Run Matching Engine' : 'Re-run Evaluation'}
          </Button>
          <Link to={`/admin/projects/${project.id}/shortlist`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Shortlist Curation ({responsesCount})
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
            title="Matching action error"
            onDismiss={() => setErrorMsg(null)}
          >
            {errorMsg}
          </Alert>
        )}

        {/* Internal Confidentiality Boundary Notice */}
        <div className="px-4 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-[var(--color-text-primary)]">
                Admin-Only Candidate Pool:
              </strong>{' '}
              Raw match scores, eligibility warnings, and non-shortlisted quotes are never exposed to clients or competing practitioners.
            </span>
          </span>
          <span className="text-[var(--color-text-muted)] tabular-nums">
            Brief Snapshot v{project.version || 1}
          </span>
        </div>

        {/* Project Context Card */}
        <Card className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <div className="text-xs font-medium text-[var(--color-text-muted)]">
                Service &amp; Type
              </div>
              <div className="mt-1 font-semibold text-[var(--color-text-primary)] text-sm">
                {service?.name || project.serviceId}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                {projectType?.name || project.projectTypeId}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[var(--color-text-muted)]">
                Indicative Budget
              </div>
              <div className="mt-1 font-semibold tabular-nums text-[var(--color-text-primary)] text-sm flex items-center gap-1">
                <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                <span>{formatProjectBudget(project.brief?.budget, lookupRangeLabel)}</span>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">Client brief range</div>
            </div>

            <div>
              <div className="text-xs font-medium text-[var(--color-text-muted)]">
                Target Timeline
              </div>
              <div className="mt-1 font-semibold text-[var(--color-text-primary)] text-sm flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                <span>Start: {formatTimelineOption(project.brief?.timeline?.preferredStart)}</span>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                Flexibility: {formatTimelineOption(project.brief?.timeline?.flexibility)}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[var(--color-text-muted)]">
                Workflow State
              </div>
              <div className="mt-1.5">
                <Badge variant={adminStatus.variant}>{adminStatus.label}</Badge>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                Brief locked during curation
              </div>
            </div>
          </div>
        </Card>

        {/* Curation Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-4">
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">Evaluated</div>
            <div className="mt-1 text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
              {totalEvaluated}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">
              Eligible Pool
            </div>
            <div className="mt-1 text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
              {eligibleCount}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">
              Invitations Sent
            </div>
            <div className="mt-1 text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
              {oppsSentCount}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">
              Quotes Received
            </div>
            <div className="mt-1 text-2xl font-sans font-bold tabular-nums text-[var(--color-success)]">
              {responsesCount}
            </div>
          </Card>
          <Card className="p-4 col-span-2 sm:col-span-1">
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">
              Declined / Passed
            </div>
            <div className="mt-1 text-2xl font-sans font-bold tabular-nums text-[var(--color-text-secondary)]">
              {passedCount}
            </div>
          </Card>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div
            role="tablist"
            aria-label="Filter matching candidates"
            className="flex w-full min-w-0 md:w-auto items-center gap-1 p-1 overflow-x-auto overscroll-x-contain bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-[13px]"
          >
            {(
              [
                { id: 'all', label: `All (${matches.length})` },
                { id: 'eligible', label: `Eligible (${eligibleCount})` },
                { id: 'sent', label: `Invited (${oppsSentCount})` },
                { id: 'responded', label: `Quotes In (${responsesCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filterMode === tab.id}
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1.5 rounded-[6px] font-medium tabular-nums transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  filterMode === tab.id
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-64">
            <SearchInput
              aria-label="Filter candidates by name or country"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Filter practitioner…"
            />
          </div>
        </div>

        {/* Candidates List */}
        {matches.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Matching evaluation not yet run"
            description="Run the matching evaluation to score verified practitioners against this brief's service, timeline, and indicative budget."
            action={{
              label: 'Run Matching Engine',
              onClick: handleRunMatching,
            }}
          />
        ) : filteredMatches.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No candidates match this filter"
            description="Switch to All or clear your search filter to inspect all evaluated practitioners."
            action={{
              label: 'Show All Candidates',
              onClick: () => {
                setFilterMode('all');
                setSearchQuery('');
              },
            }}
          />
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((candidate) => {
              const isExpanded = expandedCandidateId === candidate.id;
              const isSending = sendingOpportunityId === candidate.id;
              const opp = opportunities.find(
                (o) => o.matchId === candidate.id || o.id === candidate.opportunityId
              );
              const quote = quotes.find(
                (q) => q.matchId === candidate.id || q.opportunityId === opp?.id
              );

              return (
                <Card
                  key={candidate.id}
                  className={`p-5 transition-colors ${
                    candidate.eligibilityStatus === 'ineligible' ||
                    candidate.status === 'excluded' ||
                    candidate.status === 'admin_removed'
                      ? 'opacity-75 bg-[var(--color-surface-secondary)]/60'
                      : 'bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Internal Admin Score Box */}
                      <div
                        title="Confidential Admin Match Score (not visible to client)"
                        className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-[var(--radius-card)] bg-[var(--color-surface-secondary)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)]"
                      >
                        <span className="text-lg font-sans font-bold tabular-nums leading-none">
                          {candidate.matchScore}
                        </span>
                        <span className="text-[11px] font-medium text-[var(--color-text-muted)] mt-0.5">
                          Score
                        </span>
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="typo-card-title text-[var(--color-text-primary)]">
                            {candidate.professionalName}
                          </h3>
                          <Badge
                            variant={
                              candidate.eligibilityStatus === 'eligible' ? 'success' : 'neutral'
                            }
                          >
                            {candidate.eligibilityStatus === 'eligible'
                              ? 'Eligible'
                              : 'Ineligible'}
                          </Badge>

                          {(candidate.status === 'excluded' ||
                            candidate.status === 'admin_removed') && (
                            <Badge variant="neutral">Excluded</Badge>
                          )}
                          {candidate.status === 'opportunity_sent' && (
                            <Badge variant="info">Invitation Sent</Badge>
                          )}
                          {candidate.status === 'responded' && (
                            <Badge variant="success">Quote Received</Badge>
                          )}
                          {candidate.status === 'passed' && (
                            <Badge variant="neutral">Declined</Badge>
                          )}
                        </div>

                        <div className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                          {candidate.professionalTitle}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--color-text-muted)] tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[var(--color-text-muted)]" aria-hidden="true" />
                            {candidate.professionalCountry} ({candidate.professionalTimezone})
                          </span>
                          <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                            ·
                          </span>
                          <span>
                            Availability:{' '}
                            <strong className="font-semibold text-[var(--color-text-primary)] capitalize">
                              {candidate.availabilityStatus.replace(/_/g, ' ')}
                            </strong>{' '}
                            (Next: {candidate.nextAvailableDate})
                          </span>
                          <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            Floor: €{(candidate.minimumBudgetMinor / 100).toLocaleString()} EUR
                          </span>
                        </div>

                        {candidate.matchReasons && candidate.matchReasons.length > 0 && (
                          <div className="text-xs text-[var(--color-text-secondary)] pt-1">
                            {candidate.matchReasons.slice(0, 3).join(' · ')}
                          </div>
                        )}

                        {candidate.eligibilityReasons && candidate.eligibilityReasons.length > 0 && (
                          <div className="pt-1 text-xs text-[var(--color-error-text)] flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>Ineligibility: {candidate.eligibilityReasons.join('; ')}</span>
                          </div>
                        )}
                        {candidate.warnings && candidate.warnings.length > 0 && (
                          <div className="pt-0.5 text-xs text-[var(--color-warning-text)] flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>Curator note: {candidate.warnings.join('; ')}</span>
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
                        {isExpanded ? 'Hide Score' : 'Score Breakdown'}
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
                            disabled={
                              isSending ||
                              !!sendingOpportunityId ||
                              candidate.eligibilityStatus !== 'eligible'
                            }
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

                      {(candidate.status === 'excluded' ||
                        candidate.status === 'admin_removed') && (
                        <div className="text-right">
                          <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                            Excluded from pool
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)] tabular-nums block">
                            {candidate.excludedAt
                              ? new Date(candidate.excludedAt).toLocaleDateString()
                              : 'Removed by Admin'}
                          </span>
                        </div>
                      )}

                      {candidate.status === 'opportunity_sent' && opp && (
                        <div className="text-right">
                          <span className="text-xs text-[var(--color-text-secondary)] tabular-nums block">
                            Sent {new Date(opp.createdAt).toLocaleDateString()}
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
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                          Internal 6-Dimension Score Breakdown (Admin Only)
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">
                          Total: {candidate.matchScore} / 100
                        </span>
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
              ? 'Alternative Commercial Quote'
              : 'Standard Commercial Quote'
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
              <div className="p-4 rounded-[var(--radius-input)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-[var(--color-text-muted)] block">
                    Total Proposed Quote
                  </span>
                  <span className="text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                    €{(selectedQuote.amountMinor / 100).toLocaleString()}{' '}
                    {selectedQuote.currency}
                  </span>
                </div>
                <Badge variant={getBudgetRelationDisplay(selectedQuote.budgetRelation).variant}>
                  {getBudgetRelationDisplay(selectedQuote.budgetRelation).label}
                </Badge>
              </div>

              {selectedQuote.quoteType === 'alternative' &&
                selectedQuote.alternativeExplanation && (
                  <div className="p-3.5 rounded-[var(--radius-input)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-xs text-[var(--color-warning-text)]">
                    <strong className="font-semibold block mb-1">
                      Alternative Scope Rationale:
                    </strong>
                    <p className="leading-relaxed">{selectedQuote.alternativeExplanation}</p>
                  </div>
                )}

              <div>
                <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">
                  Scope Summary
                </span>
                <p className="text-[13px] text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] p-3 rounded-[var(--radius-input)] leading-relaxed whitespace-pre-wrap">
                  {selectedQuote.scopeSummary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[var(--color-text-muted)] font-medium block">
                    Proposed Start Date
                  </span>
                  <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                    {selectedQuote.proposedStartDate}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] font-medium block">
                    Estimated Duration
                  </span>
                  <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                    {selectedQuote.estimatedDurationDays} days
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] font-medium block">
                    Revisions Included
                  </span>
                  <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                    {selectedQuote.revisionsIncluded}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] font-medium block">Status</span>
                  <span className="font-semibold text-[var(--color-text-primary)] capitalize">
                    {selectedQuote.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {selectedQuote.includedItems && selectedQuote.includedItems.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">
                    Included Deliverables
                  </span>
                  <ul className="list-disc list-inside text-xs text-[var(--color-text-secondary)] space-y-0.5">
                    {selectedQuote.includedItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedQuote.excludedItems && selectedQuote.excludedItems.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-1">
                    Explicit Exclusions
                  </span>
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
            title="Exclude candidate from this project?"
            description="Removes this practitioner from the candidate pool for this brief only."
            maxWidth="md"
          >
            <div className="space-y-4 pt-1">
              <div className="p-3.5 rounded-[var(--radius-input)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-[var(--color-text-primary)] block text-sm break-words">
                    {candidateToExclude.professionalName}
                  </span>
                  <span className="text-[var(--color-text-secondary)] tabular-nums">
                    {candidateToExclude.professionalTitle} · Score: {candidateToExclude.matchScore}
                  </span>
                </div>
                <Badge
                  variant={
                    candidateToExclude.eligibilityStatus === 'eligible' ? 'success' : 'neutral'
                  }
                >
                  {candidateToExclude.eligibilityStatus === 'eligible'
                    ? 'Eligible'
                    : 'Ineligible'}
                </Badge>
              </div>

              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Exclusion applies solely to this project brief. Their verified profile and eligibility for other client projects remain unaffected.
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
                  Exclude Candidate
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};
