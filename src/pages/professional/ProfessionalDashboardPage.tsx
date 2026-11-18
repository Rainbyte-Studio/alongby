import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tabs } from '../../components/ui/Tabs';
import { availabilityService } from '../../services/availabilityService';
import { auditService } from '../../services/auditService';
import { opportunityService } from '../../services/opportunityService';
import {
  Inbox,
  FolderKanban,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Save,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Euro,
  Edit3,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AvailabilityStatus, VerificationStatus, Opportunity } from '../../types';

const AVAILABILITY_STATUS_OPTIONS = [
  { value: 'available', label: 'Available — Ready for new projects' },
  { value: 'limited', label: 'Limited — 1 project spot remaining' },
  { value: 'fully_booked', label: 'Fully Booked — Not taking projects currently' },
  { value: 'unavailable', label: 'Unavailable — Sabbatical / Leave' },
];

export const ProfessionalDashboardPage: React.FC = () => {
  const { currentUser, userProfile, professionalProfile, availability, refreshData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'overview' | 'availability' | 'opportunities' | 'projects'>(
    initialTab === 'availability' || initialTab === 'opportunities' || initialTab === 'projects'
      ? initialTab
      : 'overview'
  );

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (
      currentTab &&
      (currentTab === 'overview' ||
        currentTab === 'availability' ||
        currentTab === 'opportunities' ||
        currentTab === 'projects')
    ) {
      setActiveTab(currentTab as any);
    }
  }, [searchParams]);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [oppsLoading, setOppsLoading] = useState(false);

  const fetchOpportunities = async () => {
    if (!currentUser) return;
    try {
      setOppsLoading(true);
      const list = await opportunityService.getOpportunitiesForProfessional(currentUser.uid);
      setOpportunities(list);
    } catch (err) {
      console.error('Failed to load opportunities in professional dashboard:', err);
    } finally {
      setOppsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [currentUser]);

  // Availability form state (Phase 1G)
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

  // Sync state when availability from auth context changes
  useEffect(() => {
    if (availability) {
      setAvailStatus(availability.availabilityStatus);
      setNextDate(availability.nextAvailableDate);
      setMaxProjects(availability.maximumConcurrentProjects);
    }
  }, [availability]);

  const profName = professionalProfile?.displayName || userProfile?.displayName || 'Professional';
  const verificationStatus: VerificationStatus = professionalProfile?.verificationStatus || 'submitted';

  const verificationBadgeProps = {
    draft: { variant: 'neutral' as const, label: 'Draft Profile' },
    submitted: { variant: 'warning' as const, label: 'Under Review' },
    under_review: { variant: 'warning' as const, label: 'Under Review' },
    verified: { variant: 'success' as const, label: 'Verified Professional' },
    rejected: { variant: 'error' as const, label: 'Application Rejected' },
    suspended: { variant: 'error' as const, label: 'Suspended' },
  }[verificationStatus];

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
        { availabilityStatus: availStatus, nextAvailableDate: nextDate, maximumConcurrentProjects: maxProjects }
      );

      await refreshData();
      setAvailSuccessMsg('Availability parameters saved successfully.');
    } catch (err: any) {
      console.error('Failed to update availability:', err);
      setAvailErrorMsg(err.message || 'Failed to update availability.');
    } finally {
      setIsSavingAvail(false);
    }
  };

  return (
    <DashboardLayout
      title={`Professional Workspace`}
      subtitle={`Welcome, ${profName}. Manage your availability, review private opportunities, and deliver projects.`}
    >
      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'availability', label: 'Availability & Capacity' },
          {
            id: 'opportunities',
            label: 'Opportunities',
            badge: opportunities.filter((o) => o.status === 'pending' || o.status === 'viewed').length,
          },
          { id: 'projects', label: 'Active Projects', badge: 0 },
        ]}
      />

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Top Profile & Verification Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge variant={verificationBadgeProps.variant} size="md">
                      {verificationBadgeProps.label}
                    </Badge>
                    <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                      {professionalProfile?.yearsOfExperience || 0} years experience
                    </span>
                  </div>
                  <Button
                    id="prof-edit-profile-btn"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/professional/profile')}
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Edit Profile
                  </Button>
                </div>

                <h2 className="typo-card-title text-[var(--color-text-primary)] mb-1 break-words">
                  {profName}
                </h2>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                  {professionalProfile?.professionalTitle || 'Professional Practitioner'}
                </p>

                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
                  {professionalProfile?.shortBio || 'No biography entered.'}
                </p>

                {/* Services & Skills */}
                <div className="space-y-2 pt-4 border-t border-[var(--color-border)]">
                  <div className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Primary Services
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {professionalProfile?.primaryServices?.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-medium"
                      >
                        {s}
                      </span>
                    )) || <span className="text-xs text-[var(--color-text-secondary)]">None defined</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 text-[13px] text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    {professionalProfile?.country || 'Location unset'}
                  </span>
                  <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    {professionalProfile?.timezone || 'Timezone unset'}
                  </span>
                  <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                  <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
                    Floor Budget: €
                    {((professionalProfile?.minimumBudgetMinor || 0) / 100).toLocaleString()}{' '}
                    EUR
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[var(--color-text-secondary)]">Curation Pool Status</span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {verificationStatus === 'verified'
                    ? 'Active in Curation Scoring'
                    : 'Awaiting Admin Verification'}
                </span>
              </div>
            </Card>

            {/* Current Live Availability Quick Card */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-5">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Live Availability
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('availability')}
                  >
                    Adjust
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">Status</div>
                    <div className="capitalize font-semibold text-[var(--color-text-primary)] text-sm">
                      {availStatus.replace('_', ' ')}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">Next Available Date</div>
                    <div className="font-semibold text-[var(--color-text-primary)] text-sm flex items-center gap-1.5 tabular-nums">
                      <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                      <span>{nextDate}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">Concurrent Capacity</div>
                    <div className="font-semibold text-[var(--color-text-primary)] text-sm flex items-center gap-1.5 tabular-nums">
                      <Layers className="w-4 h-4 text-[var(--color-text-muted)]" />
                      <span>
                        {availability?.currentActiveProjectCount || 0} / {maxProjects} Active Projects
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-[var(--color-text-secondary)] pt-4 mt-6 border-t border-[var(--color-border)]">
                Matched only when capacity is open.
              </div>
            </Card>
          </div>

          {/* Opportunities Functional Empty State */}
          <div className="space-y-3">
            <h3 className="typo-section-heading text-[var(--color-text-primary)]">
              Private Project Opportunities
            </h3>
            <EmptyState
              icon={Inbox}
              title="No pending project opportunities"
              description="When our curation team selects your profile for a relevant client brief, you will receive a private opportunity notification here with project details and timeline."
            />
          </div>
        </div>
      )}

      {/* AVAILABILITY TAB (Phase 1G Real Persistence & Management) */}
      {activeTab === 'availability' && (
        <div className="max-w-2xl">
          <Card className="p-6 sm:p-8">
            <div className="mb-6 pb-4 border-b border-[var(--color-border)]">
              <h3 className="typo-section-heading text-[var(--color-text-primary)]">
                Availability & Delivery Capacity
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Configure your real-time availability. Alongby uses deterministic capacity matching to ensure you are never matched with projects when your schedule cannot accommodate them.
              </p>
            </div>

            {availSuccessMsg && (
              <div className="mb-6 p-3.5 rounded-[var(--radius-button)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-xs text-[var(--color-success-text)] flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{availSuccessMsg}</span>
              </div>
            )}

            {availErrorMsg && (
              <div className="mb-6 p-3.5 rounded-[var(--radius-button)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-xs text-[var(--color-error-text)] flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{availErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveAvailability} className="space-y-6">
              <Select
                label="Availability Status"
                required
                options={AVAILABILITY_STATUS_OPTIONS}
                value={availStatus}
                onChange={(e) => setAvailStatus(e.target.value as AvailabilityStatus)}
                helperText="Signals your current readiness to review and accept client briefs"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Next Available Start Date"
                  type="date"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="tabular-nums"
                  helperText="Earliest project kick-off date you can commit to"
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
                  helperText="Recommended 1–3 for focused high-touch delivery"
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
              <h3 className="typo-section-heading text-[var(--color-text-primary)]">
                Curated Project Opportunities
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Private opportunities matched with your services, pricing baseline, and availability.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/professional/opportunities')}
            >
              Full Opportunities Dashboard
            </Button>
          </div>

          {oppsLoading ? (
            <div className="py-12 flex justify-center">
              <span className="text-xs text-[var(--color-text-secondary)]">Loading opportunities...</span>
            </div>
          ) : opportunities.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No project opportunities yet"
              description="Opportunities are privately dispatched to vetted professionals whose services, minimum budget, and availability align with client briefs."
            />
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => {
                const snap = opp.projectSnapshot;
                const isActionRequired = opp.status === 'pending' || opp.status === 'viewed';

                return (
                  <Card key={opp.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            opp.status === 'pending'
                              ? 'warning'
                              : opp.status === 'viewed'
                              ? 'info'
                              : opp.status === 'interested'
                              ? 'success'
                              : opp.status === 'alternative_proposal'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {opp.status.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                          {snap.serviceName}
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                          · {snap.projectTypeName}
                        </span>
                      </div>

                      <h4 className="typo-card-title text-[var(--color-text-primary)] break-words">
                        {snap.title}
                      </h4>

                      <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                        {snap.description}
                      </p>

                      <div className="text-xs text-[var(--color-text-secondary)] flex flex-wrap items-center gap-3 pt-1">
                        <span className="flex items-center gap-1 font-semibold text-[var(--color-text-primary)] tabular-nums">
                          <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                          {snap.indicativeBudget?.budgetType === 'unsure' ? (
                            'Unspecified budget'
                          ) : (
                            `€${((snap.indicativeBudget?.minAmountMinor || 0) / 100).toLocaleString()} – €${((snap.indicativeBudget?.maxAmountMinor || 0) / 100).toLocaleString()}`
                          )}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                          Start: {snap.timeline?.preferredStart.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          Expires: {new Date(opp.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--color-border)]">
                      <Button
                        variant={isActionRequired ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => navigate(`/professional/opportunities/${opp.id}`)}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {isActionRequired ? 'Review & Submit Quote' : 'View Proposal'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <EmptyState
            icon={FolderKanban}
            title="No active project workspaces"
            description="Once a client accepts your quote, signs the project contract, and funds Phase 1 deposit, your active workspace will appear here."
          />
        </div>
      )}
    </DashboardLayout>
  );
};
