import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tabs } from '../../components/ui/Tabs';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { availabilityService } from '../../services/availabilityService';
import { auditService } from '../../services/auditService';
import { opportunityService } from '../../services/opportunityService';
import { projectService } from '../../services/projectService';
import { taxonomyService } from '../../services/taxonomyService';
import {
  formatProjectBudget,
  formatTimelineOption,
  getClientProjectStatusDisplay,
  getOpportunityStatusDisplay,
} from '../../utils/statusMapping';
import {
  Inbox,
  FolderKanban,
  Calendar,
  Layers,
  Save,
  Clock,
  MapPin,
  ArrowRight,
  Euro,
  Edit3,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import {
  AvailabilityStatus,
  VerificationStatus,
  Opportunity,
  Project,
} from '../../types';

const AVAILABILITY_STATUS_OPTIONS = [
  { value: 'available', label: 'Available — Ready for new projects' },
  { value: 'limited', label: 'Limited — 1 project spot remaining' },
  { value: 'fully_booked', label: 'Fully Booked — Not taking projects currently' },
  { value: 'unavailable', label: 'Unavailable — Sabbatical / Leave' },
];

type ProfessionalTabId = 'overview' | 'availability' | 'opportunities' | 'projects';

export const ProfessionalDashboardPage: React.FC = () => {
  const { currentUser, userProfile, professionalProfile, availability, refreshData } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<ProfessionalTabId>(
    initialTab === 'availability' ||
      initialTab === 'opportunities' ||
      initialTab === 'projects'
      ? initialTab
      : 'overview'
  );

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (
      currentTab === 'overview' ||
      currentTab === 'availability' ||
      currentTab === 'opportunities' ||
      currentTab === 'projects'
    ) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const handleTabChange = (nextTab: ProfessionalTabId) => {
    setActiveTab(nextTab);
    if (nextTab === 'overview') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: nextTab }, { replace: true });
    }
  };

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [oppsLoading, setOppsLoading] = useState(true);
  const [oppsError, setOppsError] = useState<string | null>(null);

  const fetchWorkspaceData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setOppsLoading(true);
      setOppsError(null);
      const list = await opportunityService.getOpportunitiesForProfessional(currentUser.uid);
      setOpportunities(list);

      const selectedOpps = list.filter((o) => o.status === 'selected');
      if (selectedOpps.length > 0) {
        const loaded = await Promise.all(
          selectedOpps.map((o) => projectService.getProject(o.projectId).catch(() => null))
        );
        const uniqueProjects = new Map<string, Project>();
        loaded.forEach((proj) => {
          if (proj) uniqueProjects.set(proj.id, proj);
        });
        setSelectedProjects(Array.from(uniqueProjects.values()));
      } else {
        setSelectedProjects([]);
      }
    } catch (err) {
      console.error('Failed to load opportunities in professional dashboard:', err);
      setOppsError('Unable to load your opportunities and engagements right now.');
    } finally {
      setOppsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // Availability form state
  const [availStatus, setAvailStatus] = useState<AvailabilityStatus>(
    availability?.availabilityStatus || 'available'
  );
  const [nextDate, setNextDate] = useState<string>(
    availability?.nextAvailableDate || new Date().toISOString().split('T')[0]
  );
  const [maxProjects, setMaxProjects] = useState<number>(
    availability?.maximumConcurrentProjects || 2
  );
  const [isSavingAvail, setIsSavingAvail] = useState(false);
  const [availSuccessMsg, setAvailSuccessMsg] = useState<string | null>(null);
  const [availErrorMsg, setAvailErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (availability) {
      setAvailStatus(availability.availabilityStatus);
      setNextDate(availability.nextAvailableDate);
      setMaxProjects(availability.maximumConcurrentProjects);
    }
  }, [availability]);

  const profName =
    professionalProfile?.displayName || userProfile?.displayName || 'Professional';
  const verificationStatus: VerificationStatus =
    professionalProfile?.verificationStatus || 'submitted';

  const verificationBadgeProps = {
    draft: { variant: 'neutral' as const, label: 'Draft Profile' },
    submitted: { variant: 'warning' as const, label: 'Under Review' },
    under_review: { variant: 'warning' as const, label: 'Under Review' },
    verified: { variant: 'success' as const, label: 'Verified Practitioner' },
    rejected: { variant: 'error' as const, label: 'Application Declined' },
    suspended: { variant: 'error' as const, label: 'Suspended' },
  }[verificationStatus];

  const budgetRanges = taxonomyService.getBudgetRanges('EUR');
  const lookupRangeLabel = (id: string) => budgetRanges.find((r) => r.id === id)?.label;

  // Derived categorized lists
  const pendingOpportunities = useMemo(
    () => opportunities.filter((o) => o.status === 'pending' || o.status === 'viewed'),
    [opportunities]
  );

  const submittedOpportunities = useMemo(
    () =>
      opportunities.filter(
        (o) =>
          o.status === 'interested' ||
          o.status === 'alternative_proposal' ||
          o.status === 'selected' ||
          o.status === 'not_selected'
      ),
    [opportunities]
  );

  // Real profile completeness calculation from persisted fields
  const profileCompleteness = useMemo(() => {
    if (!professionalProfile) return 25;
    const checks = [
      Boolean(professionalProfile.displayName?.trim()),
      Boolean(professionalProfile.professionalTitle?.trim()),
      Boolean(professionalProfile.shortBio && professionalProfile.shortBio.trim().length >= 20),
      Boolean(professionalProfile.primaryServices && professionalProfile.primaryServices.length > 0),
      Boolean(professionalProfile.skills && professionalProfile.skills.length > 0),
      Boolean(professionalProfile.minimumBudgetMinor > 0),
      Boolean(
        (professionalProfile.portfolioItems && professionalProfile.portfolioItems.length > 0) ||
          professionalProfile.website?.trim()
      ),
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [professionalProfile]);

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setAvailSuccessMsg(null);
    setAvailErrorMsg(null);
    setIsSavingAvail(true);

    try {
      await availabilityService.saveAvailability(currentUser.uid, {
        availabilityStatus: availStatus,
        nextAvailableDate: nextDate,
        maximumConcurrentProjects: Number(maxProjects),
      });

      await auditService.logEvent(
        currentUser.uid,
        'professional',
        'availability_updated',
        'availability',
        currentUser.uid,
        {
          availabilityStatus: availStatus,
          nextAvailableDate: nextDate,
          maximumConcurrentProjects: maxProjects,
        }
      );

      await refreshData();
      setAvailSuccessMsg('Availability and capacity settings updated.');
    } catch (err: any) {
      console.error('Failed to update availability:', err);
      setAvailErrorMsg(err.message || 'Failed to update availability.');
    } finally {
      setIsSavingAvail(false);
    }
  };

  return (
    <DashboardLayout
      eyebrow="Professional Workspace"
      title={`Welcome, ${profName}`}
      subtitle="Manage live availability, respond to private project invitations, and oversee proposals and agreements."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/professional/opportunities')}
          >
            All Opportunities
          </Button>
          <Button
            id="prof-edit-profile-btn"
            variant="primary"
            size="sm"
            onClick={() => navigate('/professional/profile')}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Edit Profile
          </Button>
        </div>
      }
    >
      {oppsError && (
        <Alert
          variant="error"
          title="Could not load workspace opportunities"
          onRetry={fetchWorkspaceData}
          className="mb-6"
        >
          {oppsError}
        </Alert>
      )}

      <Tabs
        activeTab={activeTab}
        onChange={(id) => handleTabChange(id as ProfessionalTabId)}
        tabs={[
          { id: 'overview', label: 'Overview' },
          {
            id: 'opportunities',
            label: 'Opportunities',
            badge: pendingOpportunities.length,
          },
          {
            id: 'projects',
            label: 'Active Engagements',
            badge: selectedProjects.length,
          },
          { id: 'availability', label: 'Availability & Capacity' },
        ]}
      />

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Operational Summary Strip */}
          <section aria-label="Practitioner workspace metrics">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-4 sm:p-5">
                <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Awaiting Your Quote
                </div>
                <div className="mt-1.5 text-2xl sm:text-3xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                  {pendingOpportunities.length}
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Private invitations open
                </div>
              </Card>

              <Card className="p-4 sm:p-5">
                <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Quotes Submitted
                </div>
                <div className="mt-1.5 text-2xl sm:text-3xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                  {submittedOpportunities.length}
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Standard or alternative quotes
                </div>
              </Card>

              <Card className="p-4 sm:p-5">
                <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Selected Engagements
                </div>
                <div className="mt-1.5 text-2xl sm:text-3xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                  {selectedProjects.length}
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Proposal, agreement or active
                </div>
              </Card>

              <Card className="p-4 sm:p-5">
                <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Profile Completeness
                </div>
                <div className="mt-1.5 text-2xl sm:text-3xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                  {profileCompleteness}%
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {profileCompleteness < 100
                    ? 'Add portfolio items to reach 100%'
                    : 'Ready for curated matching'}
                </div>
              </Card>
            </div>
          </section>

          {/* Opportunities Awaiting Response */}
          <section aria-labelledby="prof-pending-opps-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="prof-pending-opps-heading"
                className="typo-section-heading text-[var(--color-text-primary)]"
              >
                Opportunities Awaiting Response
              </h2>
              {opportunities.length > 0 && (
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => navigate('/professional/opportunities')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View all ({opportunities.length})
                </Button>
              )}
            </div>

            {oppsLoading ? (
              <Card className="py-12 flex flex-col items-center justify-center">
                <LoadingSpinner size="sm" label="Loading opportunities…" />
              </Card>
            ) : pendingOpportunities.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No invitations awaiting your response"
                description="When Alongby curates your profile for a matching client brief, your private invitation will appear here with scope, timeline, and budget range."
                actionLabel={opportunities.length > 0 ? 'View Past Responses' : undefined}
                onAction={
                  opportunities.length > 0
                    ? () => navigate('/professional/opportunities')
                    : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                {pendingOpportunities.slice(0, 3).map((opp) => {
                  const snap = opp.projectSnapshot;
                  const oppDisplay = getOpportunityStatusDisplay(opp.status);

                  return (
                    <Card
                      key={opp.id}
                      className="p-5 border-[var(--color-border-strong)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                          <Badge variant={oppDisplay.variant}>{oppDisplay.label}</Badge>
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            {snap.serviceName}
                          </span>
                          <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                            ·
                          </span>
                          <span>{snap.projectTypeName}</span>
                        </div>

                        <h3 className="typo-card-title text-[var(--color-text-primary)]">
                          {snap.title}
                        </h3>

                        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                          {snap.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)] pt-1">
                          <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-text-primary)] tabular-nums">
                            <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                            {formatProjectBudget(snap.indicativeBudget, lookupRangeLabel)}
                          </span>
                          <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                            ·
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                            Start: {formatTimelineOption(snap.timeline?.preferredStart)}
                          </span>
                          <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                            ·
                          </span>
                          <span className="tabular-nums">
                            Respond by {new Date(opp.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--color-border)]">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/professional/opportunities/${opp.id}`)}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Review &amp; Submit Quote
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Selected Engagements & Submitted Quotes (Separated clearly per Stage D4) */}
          {!oppsLoading && submittedOpportunities.length > 0 && (
            <section aria-labelledby="prof-submitted-quotes-heading" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="prof-submitted-quotes-heading"
                  className="typo-section-heading text-[var(--color-text-primary)]"
                >
                  Submitted Quotes &amp; Outcomes
                </h2>
              </div>

              <div className="space-y-3">
                {submittedOpportunities.slice(0, 4).map((opp) => {
                  const snap = opp.projectSnapshot;
                  const oppDisplay = getOpportunityStatusDisplay(opp.status);
                  const linkedProject = selectedProjects.find((p) => p.id === opp.projectId);

                  return (
                    <Card
                      key={`sub-${opp.id}`}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant={oppDisplay.variant}>{oppDisplay.label}</Badge>
                          <span className="text-[var(--color-text-secondary)]">
                            {snap.serviceName}
                          </span>
                          {opp.respondedAt && (
                            <>
                              <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-[var(--color-text-muted)] tabular-nums">
                                Responded {new Date(opp.respondedAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="typo-card-title text-[var(--color-text-primary)]">
                          {snap.title}
                        </h3>
                      </div>

                      <div className="shrink-0 flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/professional/opportunities/${opp.id}`)}
                        >
                          View Quote
                        </Button>
                        {opp.status === 'selected' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                navigate(`/professional/projects/${opp.projectId}/proposal`)
                              }
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            >
                              Proposal
                            </Button>
                            {linkedProject &&
                              (linkedProject.currentContractId ||
                                linkedProject.status === 'proposal_accepted' ||
                                linkedProject.status === 'contract_pending' ||
                                linkedProject.status === 'awaiting_signatures' ||
                                linkedProject.status === 'awaiting_deposit') && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    navigate(`/professional/projects/${opp.projectId}/contract`)
                                  }
                                >
                                  Agreement
                                </Button>
                              )}
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Practitioner Profile & Live Availability Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge variant={verificationBadgeProps.variant} size="md">
                      {verificationBadgeProps.label}
                    </Badge>
                    <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                      {professionalProfile?.yearsOfExperience || 0} yrs experience
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/professional/profile')}
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Manage Profile
                  </Button>
                </div>

                <h2 className="typo-card-title text-[var(--color-text-primary)] mb-1">
                  {profName}
                </h2>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                  {professionalProfile?.professionalTitle || 'Practitioner'}
                </p>

                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
                  {professionalProfile?.shortBio || 'Add a concise summary of your practice in your profile.'}
                </p>

                <div className="space-y-1.5 pt-4 border-t border-[var(--color-border)]">
                  <div className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Primary Services
                  </div>
                  <p className="text-xs text-[var(--color-text-primary)] font-medium leading-relaxed">
                    {professionalProfile?.primaryServices?.length
                      ? professionalProfile.primaryServices.join(' · ')
                      : 'None defined'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 text-[13px] text-[var(--color-text-secondary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                    {professionalProfile?.country || 'Location unset'}
                  </span>
                  <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                    {professionalProfile?.timezone || 'Timezone unset'}
                  </span>
                  <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
                    Floor: €{((professionalProfile?.minimumBudgetMinor || 0) / 100).toLocaleString()} EUR
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[var(--color-text-secondary)]">Matching Eligibility</span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {verificationStatus === 'verified'
                    ? 'Active in Curated Pool'
                    : 'Awaiting Curation Review'}
                </span>
              </div>
            </Card>

            {/* Live Availability Card */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Live Availability
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTabChange('availability')}
                  >
                    Adjust
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Current Status
                    </div>
                    <div className="capitalize font-semibold text-[var(--color-text-primary)] text-sm">
                      {availStatus.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Earliest Start Date
                    </div>
                    <div className="font-semibold text-[var(--color-text-primary)] text-sm flex items-center gap-1.5 tabular-nums">
                      <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                      <span>{nextDate}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Concurrent Capacity
                    </div>
                    <div className="font-semibold text-[var(--color-text-primary)] text-sm flex items-center gap-1.5 tabular-nums">
                      <Layers className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                      <span>
                        {availability?.currentActiveProjectCount || 0} / {maxProjects} Active Projects
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-[var(--color-text-secondary)] pt-4 mt-6 border-t border-[var(--color-border)]">
                Used directly by Alongby matching to prevent overbooking.
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* AVAILABILITY TAB */}
      {activeTab === 'availability' && (
        <div className="max-w-2xl">
          <Card className="p-6 sm:p-8">
            <div className="mb-6 pb-4 border-b border-[var(--color-border)]">
              <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                Availability &amp; Delivery Capacity
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Keep your availability and earliest kickoff date accurate so Alongby only invites you to briefs that fit your schedule.
              </p>
            </div>

            {availSuccessMsg && (
              <Alert
                variant="success"
                onDismiss={() => setAvailSuccessMsg(null)}
                className="mb-6"
              >
                {availSuccessMsg}
              </Alert>
            )}

            {availErrorMsg && (
              <Alert
                variant="error"
                title="Unable to save availability"
                onDismiss={() => setAvailErrorMsg(null)}
                className="mb-6"
              >
                {availErrorMsg}
              </Alert>
            )}

            <form onSubmit={handleSaveAvailability} className="space-y-6">
              <Select
                label="Availability Status"
                required
                options={AVAILABILITY_STATUS_OPTIONS}
                value={availStatus}
                onChange={(e) => setAvailStatus(e.target.value as AvailabilityStatus)}
                helperText="Signals your current readiness to review and quote on client briefs."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Next Available Start Date"
                  type="date"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="tabular-nums"
                  helperText="Earliest project kickoff date you can commit to."
                />

                <Input
                  label="Maximum Concurrent Projects"
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={maxProjects}
                  onChange={(e) => setMaxProjects(parseInt(e.target.value, 10) || 1)}
                  className="tabular-nums"
                  helperText="Recommended 1–3 for high-touch delivery."
                />
              </div>

              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSavingAvail}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Availability
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* OPPORTUNITIES TAB */}
      {activeTab === 'opportunities' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                Curated Project Opportunities
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Private invitations matched to your services, floor budget, and availability.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/professional/opportunities')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Full Opportunities View
            </Button>
          </div>

          {oppsLoading ? (
            <Card className="py-16 flex flex-col items-center justify-center">
              <LoadingSpinner size="sm" label="Loading opportunities…" />
            </Card>
          ) : opportunities.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No project opportunities yet"
              description="Opportunities are privately dispatched to verified practitioners whose capabilities, floor budget, and availability match submitted client briefs."
            />
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => {
                const snap = opp.projectSnapshot;
                const oppDisplay = getOpportunityStatusDisplay(opp.status);

                return (
                  <Card
                    key={opp.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-xl min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={oppDisplay.variant}>{oppDisplay.label}</Badge>
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                          {snap.serviceName}
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                          · {snap.projectTypeName}
                        </span>
                      </div>

                      <h3 className="typo-card-title text-[var(--color-text-primary)]">
                        {snap.title}
                      </h3>

                      <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                        {snap.description}
                      </p>

                      <div className="text-xs text-[var(--color-text-secondary)] flex flex-wrap items-center gap-3 pt-1">
                        <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-text-primary)] tabular-nums">
                          <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                          {formatProjectBudget(snap.indicativeBudget, lookupRangeLabel)}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                          Start: {formatTimelineOption(snap.timeline?.preferredStart)}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                          ·
                        </span>
                        <span className="tabular-nums">
                          Expires {new Date(opp.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--color-border)]">
                      <Button
                        variant={oppDisplay.actionRequired ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => navigate(`/professional/opportunities/${opp.id}`)}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {oppDisplay.actionRequired
                          ? 'Review & Submit Quote'
                          : 'View Opportunity'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE ENGAGEMENTS TAB */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {oppsLoading ? (
            <Card className="py-16 flex flex-col items-center justify-center">
              <LoadingSpinner size="sm" label="Loading active engagements…" />
            </Card>
          ) : selectedProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No active engagements yet"
              description="When a client selects your quote from a curated shortlist, you can review the commercial proposal, sign the service agreement, and track milestones here."
            />
          ) : (
            selectedProjects.map((project) => {
              const service = taxonomyService.getServiceCategoryById(project.serviceId);
              const statusInfo = getClientProjectStatusDisplay(project.status, project.submittedAt);
              const showContract =
                Boolean(project.currentContractId) ||
                project.status === 'proposal_accepted' ||
                project.status === 'contract_pending' ||
                project.status === 'awaiting_signatures' ||
                project.status === 'awaiting_deposit' ||
                project.status === 'active_phase_1' ||
                project.status === 'phase_1_review' ||
                project.status === 'awaiting_final_payment' ||
                project.status === 'active_phase_2' ||
                project.status === 'final_review' ||
                project.status === 'completed';

              return (
                <Card
                  key={project.id}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <Badge variant={statusInfo.badgeVariant}>{statusInfo.badgeText}</Badge>
                      {service && (
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {service.name}
                        </span>
                      )}
                      {project.clientName && (
                        <>
                          <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                            ·
                          </span>
                          <span>
                            Client: {project.clientName}
                            {project.clientCompanyName ? ` (${project.clientCompanyName})` : ''}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="typo-card-title text-[var(--color-text-primary)]">
                      {project.title}
                    </h3>

                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                      {statusInfo.description}
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--color-border)]">
                    <Button
                      variant={showContract ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => navigate(`/professional/projects/${project.id}/proposal`)}
                      leftIcon={<FileText className="w-3.5 h-3.5" />}
                    >
                      Proposal
                    </Button>
                    {showContract && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/professional/projects/${project.id}/contract`)}
                        leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                      >
                        Service Agreement
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </DashboardLayout>
  );
};
