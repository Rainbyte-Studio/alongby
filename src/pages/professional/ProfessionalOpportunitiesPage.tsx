import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { SearchInput } from '../../components/ui/SearchInput';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { opportunityService } from '../../services/opportunityService';
import {
  formatProjectBudget,
  formatTimelineOption,
  getOpportunityStatusDisplay,
} from '../../utils/statusMapping';
import { Opportunity } from '../../types';
import {
  Inbox,
  ArrowRight,
  Clock,
  Euro,
  Calendar,
  RefreshCw,
} from 'lucide-react';

export const ProfessionalOpportunitiesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'all' | 'action_required' | 'responded' | 'closed'
  >('all');

  const fetchOpportunities = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const list = await opportunityService.getOpportunitiesForProfessional(currentUser.uid);
      setOpportunities(list);
    } catch (err: any) {
      console.error('Failed to load opportunities:', err);
      setErrorMsg(err?.message || 'Unable to load project opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [currentUser]);

  // Counts
  const actionRequiredCount = opportunities.filter(
    (o) => o.status === 'pending' || o.status === 'viewed'
  ).length;
  const respondedCount = opportunities.filter(
    (o) =>
      o.status === 'interested' ||
      o.status === 'alternative_proposal' ||
      o.status === 'selected'
  ).length;
  const closedCount = opportunities.filter(
    (o) =>
      o.status === 'passed' ||
      o.status === 'expired' ||
      o.status === 'not_selected' ||
      o.status === 'withdrawn'
  ).length;

  const filteredOpportunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return opportunities.filter((o) => {
      if (activeTab === 'action_required' && o.status !== 'pending' && o.status !== 'viewed') {
        return false;
      }
      if (
        activeTab === 'responded' &&
        o.status !== 'interested' &&
        o.status !== 'alternative_proposal' &&
        o.status !== 'selected'
      ) {
        return false;
      }
      if (
        activeTab === 'closed' &&
        o.status !== 'passed' &&
        o.status !== 'expired' &&
        o.status !== 'not_selected' &&
        o.status !== 'withdrawn'
      ) {
        return false;
      }

      if (q) {
        const snap = o.projectSnapshot;
        const haystack = `${snap.title} ${snap.serviceName} ${snap.projectTypeName} ${snap.industryName || ''}`.toLowerCase();
        return haystack.includes(q);
      }

      return true;
    });
  }, [opportunities, activeTab, searchQuery]);

  const calculateDaysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Window closed';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  return (
    <DashboardLayout
      role="professional"
      breadcrumbs={[
        { label: 'Workspace', to: '/professional' },
        { label: 'Opportunities' },
      ]}
      title="Project Opportunities"
      subtitle="Private invitations curated for your verified services, engagement minimum, and availability."
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOpportunities}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {errorMsg && (
          <Alert variant="error" onDismiss={() => setErrorMsg(null)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{errorMsg}</span>
              <Button variant="outline" size="sm" onClick={fetchOpportunities}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            tabs={[
              { id: 'all', label: 'All Invitations', badge: opportunities.length },
              { id: 'action_required', label: 'Action Required', badge: actionRequiredCount },
              { id: 'responded', label: 'Quoted & Selected', badge: respondedCount },
              { id: 'closed', label: 'Declined & Closed', badge: closedCount },
            ]}
          />

          {opportunities.length > 0 && (
            <div className="w-full sm:w-64 shrink-0">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search opportunities…"
                aria-label="Search opportunities"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" label="Loading project opportunities…" />
          </div>
        ) : opportunities.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No project opportunities yet"
            description="Opportunities are privately dispatched to verified professionals whose services, minimum budget, and availability match submitted client briefs."
            action={{
              label: 'Review Availability Settings',
              onClick: () => navigate('/professional'),
            }}
          />
        ) : filteredOpportunities.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No matching opportunities"
            description={
              searchQuery
                ? `No opportunities matched "${searchQuery}".`
                : 'Select another filter tab to review other invitations.'
            }
            action={
              searchQuery
                ? {
                    label: 'Clear Search',
                    onClick: () => setSearchQuery(''),
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredOpportunities.map((opp) => {
              const snap = opp.projectSnapshot;
              const statusDisplay = getOpportunityStatusDisplay(opp.status);
              const isActionRequired = statusDisplay.actionRequired;
              const daysLeft = calculateDaysLeft(opp.expiresAt);

              return (
                <Card
                  key={opp.id}
                  className={`p-5 sm:p-6 transition-colors ${
                    opp.status === 'pending'
                      ? 'border-[var(--color-border-strong)]'
                      : 'hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left details */}
                    <div className="space-y-2.5 max-w-2xl min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant={statusDisplay.variant} size="sm">
                          {statusDisplay.label}
                        </Badge>
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {snap.serviceName}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-[var(--color-text-secondary)] font-medium">
                          {snap.projectTypeName}
                        </span>
                        {snap.industryName && (
                          <>
                            <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-[var(--color-text-secondary)] font-medium">
                              {snap.industryName}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="typo-card-title text-[var(--color-text-primary)] break-words">
                        {snap.title}
                      </h3>

                      <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                        {snap.description}
                      </p>

                      {/* Meta stats */}
                      <div className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--color-text-secondary)] pt-1">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)] tabular-nums">
                          <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                          {formatProjectBudget(snap.indicativeBudget)}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                          Start: {formatTimelineOption(snap.timeline?.preferredStart)}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                          {daysLeft}
                        </span>
                      </div>

                      {/* Editorial inline match reasons */}
                      {opp.matchReasons && opp.matchReasons.length > 0 && (
                        <p className="text-xs text-[var(--color-text-secondary)] pt-0.5 leading-relaxed">
                          <span className="font-medium text-[var(--color-text-primary)]">
                            Matched on:
                          </span>{' '}
                          {opp.matchReasons.slice(0, 3).join(' · ')}
                        </p>
                      )}
                    </div>

                    {/* Right action */}
                    <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 border-t lg:border-t-0 pt-4 lg:pt-0 border-[var(--color-border)]">
                      {opp.status === 'selected' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/professional/projects/${opp.projectId}/proposal`)}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          Open Proposal
                        </Button>
                      )}
                      {isActionRequired ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/professional/opportunities/${opp.id}`)}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          Review &amp; Submit Quote
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/professional/opportunities/${opp.id}`)}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
