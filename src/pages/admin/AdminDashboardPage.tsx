import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from '../../components/ui/Table';
import { profileService } from '../../services/profileService';
import { auditService } from '../../services/auditService';
import { projectService } from '../../services/projectService';
import { taxonomyService } from '../../services/taxonomyService';
import {
  formatProjectBudget,
  formatTimelineOption,
  getAdminProjectStatusDisplay,
} from '../../utils/statusMapping';
import { ProfessionalProfile, VerificationStatus, Project } from '../../types';
import {
  ShieldCheck,
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

type AdminTabId = 'projects' | 'professionals' | 'audit';

export const AdminDashboardPage: React.FC = () => {
  const { currentUser, refreshData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTabId>('projects');
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Filters
  const [profSearch, setProfSearch] = useState('');
  const [profStatusFilter, setProfStatusFilter] = useState<string>('all');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStageFilter, setProjectStageFilter] = useState<string>('all');

  const fetchProfessionals = useCallback(async () => {
    try {
      setLoading(true);
      const list = await profileService.getAllProfessionals();
      setProfessionals(list);
    } catch (err) {
      console.error('Failed to load professionals for admin:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Unable to load practitioner registry. Please refresh.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const allProjects = await projectService.getAllProjects();
      setProjects(allProjects);
    } catch (err) {
      console.error('Failed to load projects for admin:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Unable to load project matching queue. Please refresh.',
      });
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessionals();
    fetchProjects();
  }, [fetchProfessionals, fetchProjects]);

  const handleRefreshAll = () => {
    setFeedbackMsg(null);
    fetchProfessionals();
    fetchProjects();
  };

  const handleUpdateStatus = async (userId: string, status: VerificationStatus) => {
    if (!currentUser) return;
    setActionLoadingId(userId);
    setFeedbackMsg(null);
    try {
      await profileService.updateVerificationStatus(userId, status);
      await auditService.logEvent(
        currentUser.uid,
        'admin',
        'professional_verification_updated',
        'professionalProfile',
        userId,
        { newStatus: status }
      );
      await fetchProfessionals();
      await refreshData();
      setFeedbackMsg({
        type: 'success',
        text: `Practitioner verification status updated to "${status.replace(/_/g, ' ')}".`,
      });
    } catch (err: any) {
      console.error('Admin status update failed:', err);
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Failed to update verification status.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success">Verified</Badge>;
      case 'under_review':
      case 'submitted':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'suspended':
        return <Badge variant="danger">Suspended</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const budgetRanges = taxonomyService.getBudgetRanges('EUR');
  const lookupRangeLabel = (id: string) => budgetRanges.find((r) => r.id === id)?.label;

  // Derived operational metrics
  const pendingVerifications = useMemo(
    () =>
      professionals.filter(
        (p) => p.verificationStatus === 'submitted' || p.verificationStatus === 'under_review'
      ),
    [professionals]
  );

  const verifiedCount = useMemo(
    () => professionals.filter((p) => p.verificationStatus === 'verified').length,
    [professionals]
  );

  const matchingQueueCount = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.status === 'submitted' ||
          p.status === 'budget_review' ||
          p.status === 'matching' ||
          p.status === 'awaiting_professional_responses' ||
          p.status === 'shortlist_review'
      ).length,
    [projects]
  );

  const commercialOversightCount = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.status === 'shortlist_ready' ||
          p.status === 'professional_selected' ||
          p.status === 'proposal_pending' ||
          p.status === 'proposal_accepted' ||
          p.status === 'contract_pending' ||
          p.status === 'awaiting_signatures' ||
          p.status === 'awaiting_deposit'
      ).length,
    [projects]
  );

  const exceptionProjects = useMemo(
    () => projects.filter((p) => p.status === 'disputed' || p.status === 'paused'),
    [projects]
  );

  const actionQueueProjects = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.status === 'submitted' ||
          p.status === 'budget_review' ||
          p.status === 'matching' ||
          p.status === 'shortlist_review' ||
          p.status === 'disputed'
      ),
    [projects]
  );

  // Filtered projects
  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    return projects.filter((proj) => {
      if (projectStageFilter === 'curation') {
        if (
          !(
            proj.status === 'submitted' ||
            proj.status === 'budget_review' ||
            proj.status === 'matching' ||
            proj.status === 'awaiting_professional_responses' ||
            proj.status === 'shortlist_review'
          )
        ) {
          return false;
        }
      } else if (projectStageFilter === 'shortlist') {
        if (
          !(
            proj.status === 'shortlist_review' ||
            proj.status === 'shortlist_ready' ||
            proj.status === 'professional_selected'
          )
        ) {
          return false;
        }
      } else if (projectStageFilter === 'commercial') {
        if (
          !(
            proj.status === 'proposal_pending' ||
            proj.status === 'proposal_accepted' ||
            proj.status === 'contract_pending' ||
            proj.status === 'awaiting_signatures' ||
            proj.status === 'awaiting_deposit'
          )
        ) {
          return false;
        }
      } else if (projectStageFilter === 'exceptions') {
        if (!(proj.status === 'disputed' || proj.status === 'paused' || proj.status === 'cancelled')) {
          return false;
        }
      }

      if (q) {
        const serviceName =
          taxonomyService.getServiceCategoryById(proj.serviceId)?.name.toLowerCase() || '';
        return (
          (proj.title || '').toLowerCase().includes(q) ||
          (proj.clientName || '').toLowerCase().includes(q) ||
          (proj.clientCompanyName || '').toLowerCase().includes(q) ||
          serviceName.includes(q)
        );
      }

      return true;
    });
  }, [projects, projectSearch, projectStageFilter]);

  // Filtered professionals
  const filteredProfessionals = useMemo(() => {
    const q = profSearch.trim().toLowerCase();
    return professionals.filter((prof) => {
      if (profStatusFilter !== 'all') {
        if (profStatusFilter === 'pending') {
          if (
            prof.verificationStatus !== 'submitted' &&
            prof.verificationStatus !== 'under_review'
          ) {
            return false;
          }
        } else if (prof.verificationStatus !== profStatusFilter) {
          return false;
        }
      }

      if (q) {
        const servicesText = (prof.primaryServices || []).join(' ').toLowerCase();
        const skillsText = (prof.skills || []).join(' ').toLowerCase();
        return (
          (prof.displayName || '').toLowerCase().includes(q) ||
          (prof.professionalTitle || '').toLowerCase().includes(q) ||
          (prof.country || '').toLowerCase().includes(q) ||
          servicesText.includes(q) ||
          skillsText.includes(q)
        );
      }

      return true;
    });
  }, [professionals, profSearch, profStatusFilter]);

  return (
    <DashboardLayout
      eyebrow="Platform Operations"
      title="Curation & Operations Console"
      subtitle="Manage matching queues, dispatch private opportunities, publish client-safe shortlists, and govern practitioner verification."
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          isLoading={loading || projectsLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Console
        </Button>
      }
    >
      <div className="space-y-8">
        {feedbackMsg && (
          <Alert
            variant={feedbackMsg.type}
            onDismiss={() => setFeedbackMsg(null)}
          >
            {feedbackMsg.text}
          </Alert>
        )}

        {/* Operational KPI Strip */}
        <section aria-label="Operational summary">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card className="p-4">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                Matching Queue
              </div>
              <div className="mt-1 text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                {matchingQueueCount}
              </div>
              <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                Briefs in curation
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                Shortlists &amp; Proposals
              </div>
              <div className="mt-1 text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                {commercialOversightCount}
              </div>
              <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                Active commercial stages
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                Pending Verifications
              </div>
              <div className="mt-1 text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                {pendingVerifications.length}
              </div>
              <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                Practitioners awaiting review
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                Verified Pool
              </div>
              <div className="mt-1 text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                {verifiedCount}
              </div>
              <div className="mt-0.5 text-xs text-[var(--color-text-muted)] tabular-nums">
                of {professionals.length} registered
              </div>
            </Card>

            <Card className="p-4 col-span-2 sm:col-span-1">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                Exceptions
              </div>
              <div className="mt-1 text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                {exceptionProjects.length}
              </div>
              <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                Paused or disputed
              </div>
            </Card>
          </div>
        </section>

        {/* Immediate Curation Action Strip (when items require admin intervention) */}
        {!projectsLoading && actionQueueProjects.length > 0 && (
          <section aria-labelledby="admin-action-queue-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2
                id="admin-action-queue-heading"
                className="typo-section-heading text-[var(--color-text-primary)]"
              >
                Priority Curation Actions
              </h2>
              <span className="text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
                {actionQueueProjects.length} requiring action
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {actionQueueProjects.slice(0, 4).map((proj) => {
                const statusInfo = getAdminProjectStatusDisplay(proj.status);
                const isShortlistStep = proj.status === 'shortlist_review';

                return (
                  <Card
                    key={`prio-${proj.id}`}
                    className="p-4 border-[var(--color-border-strong)] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        <span className="text-xs text-[var(--color-text-muted)] truncate">
                          {proj.clientName || 'Client'}
                        </span>
                      </div>
                      <div className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                        {proj.title || 'Untitled Project'}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        navigate(
                          isShortlistStep
                            ? `/admin/projects/${proj.id}/shortlist`
                            : `/admin/projects/${proj.id}/matching`
                        )
                      }
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {isShortlistStep ? 'Curate Shortlist' : 'Open Matching'}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <Tabs
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as AdminTabId)}
          tabs={[
            {
              id: 'projects',
              label: 'Project Matching & Oversight',
              badge: projects.length,
            },
            {
              id: 'professionals',
              label: 'Practitioner Registry',
              badge: professionals.length,
            },
            { id: 'audit', label: 'Governance & Access' },
          ]}
        />

        {/* PROJECTS & MATCHING QUEUE TAB */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <div className="w-full sm:max-w-xs">
                  <SearchInput
                    aria-label="Search projects"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    onClear={() => setProjectSearch('')}
                    placeholder="Search project, client or service…"
                  />
                </div>
                <div className="w-full sm:w-52">
                  <Select
                    aria-label="Filter projects by workflow stage"
                    value={projectStageFilter}
                    onChange={(e) => setProjectStageFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Workflow Stages' },
                      { value: 'curation', label: 'Matching & Quotes' },
                      { value: 'shortlist', label: 'Shortlist & Selection' },
                      { value: 'commercial', label: 'Proposals & Agreements' },
                      { value: 'exceptions', label: 'Paused / Disputed / Cancelled' },
                    ]}
                  />
                </div>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] tabular-nums">
                Showing {filteredProjects.length} of {projects.length} projects
              </div>
            </div>

            {projectsLoading ? (
              <Card className="py-16 flex flex-col items-center justify-center">
                <LoadingSpinner label="Loading project briefs…" />
              </Card>
            ) : (
              <Table aria-label="Project matching and workflow oversight table">
                <TableHeader>
                  <TableRow hoverable={false}>
                    <TableHead>Project &amp; Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Indicative Budget</TableHead>
                    <TableHead>Start Target</TableHead>
                    <TableHead>Workflow Stage</TableHead>
                    <TableHead numeric>Updated</TableHead>
                    <TableHead align="right">Curation &amp; Oversight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableEmptyState
                      colSpan={7}
                      icon={FolderKanban}
                      title={
                        projectSearch || projectStageFilter !== 'all'
                          ? 'No projects match these filters'
                          : 'No project briefs submitted yet'
                      }
                      description={
                        projectSearch || projectStageFilter !== 'all'
                          ? 'Clear your search or stage filter to inspect all platform projects.'
                          : 'Submitted client project briefs appear here for candidate evaluation, opportunity dispatch, and shortlist publication.'
                      }
                      actionLabel={
                        projectSearch || projectStageFilter !== 'all'
                          ? 'Reset Filters'
                          : undefined
                      }
                      onAction={
                        projectSearch || projectStageFilter !== 'all'
                          ? () => {
                              setProjectSearch('');
                              setProjectStageFilter('all');
                            }
                          : undefined
                      }
                    />
                  ) : (
                    filteredProjects.map((proj) => {
                      const service = taxonomyService.getServiceCategoryById(proj.serviceId);
                      const statusInfo = getAdminProjectStatusDisplay(proj.status);
                      const hasProposal =
                        Boolean(proj.currentProposalId) ||
                        proj.status === 'professional_selected' ||
                        proj.status === 'proposal_pending' ||
                        proj.status === 'proposal_accepted' ||
                        proj.status === 'contract_pending' ||
                        proj.status === 'awaiting_signatures' ||
                        proj.status === 'awaiting_deposit';
                      const hasContract =
                        Boolean(proj.currentContractId) ||
                        proj.status === 'proposal_accepted' ||
                        proj.status === 'contract_pending' ||
                        proj.status === 'awaiting_signatures' ||
                        proj.status === 'awaiting_deposit';

                      return (
                        <TableRow key={proj.id}>
                          <TableCell className="min-w-[220px] max-w-[280px]">
                            <button
                              type="button"
                              onClick={() => navigate(`/client/projects/${proj.id}`)}
                              className="text-left font-semibold text-[var(--color-text-primary)] hover:underline underline-offset-2 block truncate max-w-full cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                            >
                              {proj.title || 'Untitled Project Brief'}
                            </button>
                            <span className="text-xs text-[var(--color-text-secondary)] block truncate mt-0.5">
                              {proj.clientName || 'Client'}
                              {proj.clientCompanyName ? ` · ${proj.clientCompanyName}` : ''}
                            </span>
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
                            {service?.name || proj.serviceId || 'Unassigned'}
                          </TableCell>

                          <TableCell className="whitespace-nowrap tabular-nums text-xs font-semibold text-[var(--color-text-primary)]">
                            {formatProjectBudget(proj.brief?.budget, lookupRangeLabel)}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
                            {formatTimelineOption(proj.brief?.timeline?.preferredStart)}
                          </TableCell>

                          <TableCell>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </TableCell>

                          <TableCell numeric className="whitespace-nowrap text-xs text-[var(--color-text-muted)]">
                            {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                          </TableCell>

                          <TableCell align="right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {proj.status === 'draft' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/client/projects/${proj.id}`)}
                                >
                                  View Draft
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant={statusInfo.needsAdminAction ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => navigate(`/admin/projects/${proj.id}/matching`)}
                                  >
                                    Matching
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/projects/${proj.id}/shortlist`)}
                                  >
                                    Shortlist
                                  </Button>
                                  {hasProposal && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/admin/projects/${proj.id}/proposal`)}
                                    >
                                      Proposal
                                    </Button>
                                  )}
                                  {hasContract && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/admin/projects/${proj.id}/contract`)}
                                    >
                                      Contract
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* PROFESSIONALS & VERIFICATION TAB */}
        {activeTab === 'professionals' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <div className="w-full sm:max-w-xs">
                  <SearchInput
                    aria-label="Search practitioners"
                    value={profSearch}
                    onChange={(e) => setProfSearch(e.target.value)}
                    onClear={() => setProfSearch('')}
                    placeholder="Search name, skill, discipline or country…"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select
                    aria-label="Filter practitioners by verification status"
                    value={profStatusFilter}
                    onChange={(e) => setProfStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'pending', label: 'Pending Review' },
                      { value: 'verified', label: 'Verified Only' },
                      { value: 'rejected', label: 'Rejected' },
                    ]}
                  />
                </div>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] tabular-nums">
                Showing {filteredProfessionals.length} of {professionals.length} practitioners
              </div>
            </div>

            {loading ? (
              <Card className="py-16 flex flex-col items-center justify-center">
                <LoadingSpinner label="Loading registered practitioners…" />
              </Card>
            ) : (
              <Table aria-label="Practitioner verification registry">
                <TableHeader>
                  <TableRow hoverable={false}>
                    <TableHead>Practitioner</TableHead>
                    <TableHead>Primary Services</TableHead>
                    <TableHead>Location &amp; Timezone</TableHead>
                    <TableHead numeric>Experience</TableHead>
                    <TableHead numeric>Floor Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead align="right">Governance Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessionals.length === 0 ? (
                    <TableEmptyState
                      colSpan={7}
                      icon={Users}
                      title={
                        profSearch || profStatusFilter !== 'all'
                          ? 'No practitioners match these filters'
                          : 'No practitioners registered yet'
                      }
                      description={
                        profSearch || profStatusFilter !== 'all'
                          ? 'Reset your search or verification status filter to inspect the full registry.'
                          : 'Practitioners appear here once they complete professional onboarding.'
                      }
                      actionLabel={
                        profSearch || profStatusFilter !== 'all' ? 'Reset Filters' : undefined
                      }
                      onAction={
                        profSearch || profStatusFilter !== 'all'
                          ? () => {
                              setProfSearch('');
                              setProfStatusFilter('all');
                            }
                          : undefined
                      }
                    />
                  ) : (
                    filteredProfessionals.map((prof) => (
                      <TableRow key={prof.userId}>
                        <TableCell className="min-w-[210px] max-w-[260px]">
                          <div className="font-semibold text-[var(--color-text-primary)] truncate">
                            {prof.displayName}
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                            {prof.professionalTitle || 'Practitioner'}
                          </div>
                        </TableCell>

                        <TableCell className="min-w-[200px] max-w-[260px]">
                          <div className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                            {(prof.primaryServices || []).join(' · ') || 'None specified'}
                          </div>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
                          {prof.country} · {prof.timezone}
                        </TableCell>

                        <TableCell numeric className="whitespace-nowrap text-xs">
                          {prof.yearsOfExperience} yrs
                        </TableCell>

                        <TableCell numeric className="whitespace-nowrap text-xs">
                          €{Math.round((prof.minimumBudgetMinor || 0) / 100).toLocaleString()} EUR
                        </TableCell>

                        <TableCell>{getVerificationBadge(prof.verificationStatus)}</TableCell>

                        <TableCell align="right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {prof.verificationStatus !== 'verified' ? (
                              <Button
                                variant="primary"
                                size="sm"
                                isLoading={actionLoadingId === prof.userId}
                                onClick={() => handleUpdateStatus(prof.userId, 'verified')}
                                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              >
                                Verify
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                isLoading={actionLoadingId === prof.userId}
                                onClick={() => handleUpdateStatus(prof.userId, 'under_review')}
                                leftIcon={<Clock className="w-3.5 h-3.5" />}
                              >
                                Set Review
                              </Button>
                            )}

                            {prof.verificationStatus !== 'rejected' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                isLoading={actionLoadingId === prof.userId}
                                onClick={() => handleUpdateStatus(prof.userId, 'rejected')}
                                className="text-[var(--color-error-text)] hover:text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)]"
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* GOVERNANCE & ACCESS TAB */}
        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[var(--color-success)] shrink-0" aria-hidden="true" />
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                  Role &amp; Data Access Boundaries
                </h2>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Administrative privileges, curation queues, and confidential scoring data are enforced at the database layer via Firestore Security Rules as well as client route guards.
              </p>

              <ul className="space-y-2.5 pt-2 text-[13px] text-[var(--color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[var(--color-text-primary)]">01.</span>
                  <span>
                    Internal match scores, candidate rankings, and curator notes are strictly isolated from Client and Professional accounts.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[var(--color-text-primary)]">02.</span>
                  <span>
                    Clients read only the published client-safe shortlist snapshot for projects they own.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[var(--color-text-primary)]">03.</span>
                  <span>
                    Practitioners cannot self-verify or inspect competing quotes submitted on the same brief.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[var(--color-text-primary)]">04.</span>
                  <span>
                    Append-only audit events record verification updates, shortlist publications, proposal acceptances, and agreement executions.
                  </span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 sm:p-7 bg-[var(--color-surface-secondary)] space-y-4">
              <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                Curation Workflow Sequence
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Standard operational progression for every submitted client brief:
              </p>
              <ol className="space-y-3 text-[13px] text-[var(--color-text-secondary)]">
                <li>
                  <strong className="text-[var(--color-text-primary)]">1. Evaluate Match Pool</strong> — Run deterministic matching against verified practitioners and inspect eligibility warnings.
                </li>
                <li>
                  <strong className="text-[var(--color-text-primary)]">2. Dispatch Private Invitations</strong> — Invite suited specialists to submit structured standard or alternative quotes.
                </li>
                <li>
                  <strong className="text-[var(--color-text-primary)]">3. Curate &amp; Publish Shortlist</strong> — Select 2–3 finalists and publish the client-safe comparison snapshot.
                </li>
                <li>
                  <strong className="text-[var(--color-text-primary)]">4. Commercial Alignment</strong> — Oversee proposal sign-off, service agreement execution, and staged activation.
                </li>
              </ol>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
