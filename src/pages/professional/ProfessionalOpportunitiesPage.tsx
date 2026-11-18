import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { opportunityService } from '../../services/opportunityService';
import { Opportunity } from '../../types';
import {
  Inbox,
  ArrowRight,
  Clock,
  Euro,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileCheck,
} from 'lucide-react';

export const ProfessionalOpportunitiesPage: React.FC = () => {
  const { currentUser, professionalProfile } = useAuth();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'action_required' | 'responded' | 'passed' | 'expired'>('all');

  const fetchOpportunities = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const list = await opportunityService.getOpportunitiesForProfessional(currentUser.uid);
      setOpportunities(list);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
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
    (o) => o.status === 'interested' || o.status === 'alternative_proposal'
  ).length;
  const passedCount = opportunities.filter((o) => o.status === 'passed').length;
  const expiredCount = opportunities.filter((o) => o.status === 'expired').length;

  const filteredOpportunities = opportunities.filter((o) => {
    if (activeTab === 'action_required') return o.status === 'pending' || o.status === 'viewed';
    if (activeTab === 'responded') return o.status === 'interested' || o.status === 'alternative_proposal';
    if (activeTab === 'passed') return o.status === 'passed';
    if (activeTab === 'expired') return o.status === 'expired';
    return true;
  });

  const getStatusBadge = (status: Opportunity['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">New Opportunity</Badge>;
      case 'viewed':
        return <Badge variant="info">Viewed</Badge>;
      case 'interested':
        return <Badge variant="success">Quote Submitted</Badge>;
      case 'alternative_proposal':
        return <Badge variant="info">Alternative Proposal</Badge>;
      case 'passed':
        return <Badge variant="neutral">Passed</Badge>;
      case 'expired':
        return <Badge variant="neutral">Expired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const calculateDaysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Expired';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  return (
    <DashboardLayout
      title="Project Opportunities"
      subtitle="Private invitations curated for your verified services, minimum engagement baseline, and availability."
      action={
        <Button variant="outline" size="sm" onClick={fetchOpportunities}>
          Refresh Opportunities
        </Button>
      }
    >
      <div className="space-y-6">
        <Tabs
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          tabs={[
            { id: 'all', label: 'All Opportunities', badge: opportunities.length },
            { id: 'action_required', label: 'Action Required', badge: actionRequiredCount },
            { id: 'responded', label: 'Responded', badge: respondedCount },
            { id: 'passed', label: 'Passed', badge: passedCount },
            { id: 'expired', label: 'Expired', badge: expiredCount },
          ]}
        />

        {loading ? (
          <LoadingSpinner label="Loading project opportunities from Alongby curation..." />
        ) : opportunities.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No project opportunities yet"
            description="Opportunities are privately matched with verified professionals whose domain services and availability schedule fit client requirements. Check back soon or ensure your availability is up to date."
          />
        ) : filteredOpportunities.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No opportunities in this filter"
            description="Select another filter tab to review other opportunities."
          />
        ) : (
          <div className="space-y-4">
            {filteredOpportunities.map((opp) => {
              const snap = opp.projectSnapshot;
              const isActionRequired = opp.status === 'pending' || opp.status === 'viewed';
              const daysLeft = calculateDaysLeft(opp.expiresAt);

              return (
                <Card
                  key={opp.id}
                  className={`p-6 transition-colors ${
                    opp.status === 'pending'
                      ? 'border-[var(--color-border-strong)]'
                      : 'hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left details */}
                    <div className="space-y-2.5 max-w-2xl min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(opp.status)}
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                          {snap.serviceName}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                          {snap.projectTypeName}
                        </span>
                        {snap.industryName && (
                          <>
                            <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
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
                        <span className="flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)] tabular-nums">
                          <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                          {snap.indicativeBudget.budgetType === 'unsure' ? (
                            'Unspecified indicative budget'
                          ) : (
                            `€${((snap.indicativeBudget.minAmountMinor || 0) / 100).toLocaleString()} – €${((snap.indicativeBudget.maxAmountMinor || 0) / 100).toLocaleString()} ${snap.indicativeBudget.currency}`
                          )}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                          Kickoff: {snap.timeline.preferredStart.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                        <span className="flex items-center gap-1.5 tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                          {daysLeft}
                        </span>
                      </div>

                      {/* Why matched reasons */}
                      {opp.matchReasons && opp.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {opp.matchReasons.slice(0, 2).map((reason, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] inline-flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right action */}
                    <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-[var(--color-border)]">
                      {isActionRequired ? (
                        <Button
                          variant="primary"
                          onClick={() => navigate(`/professional/opportunities/${opp.id}`)}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          Review & Submit Quote
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/professional/opportunities/${opp.id}`)}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          Inspect Opportunity
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
