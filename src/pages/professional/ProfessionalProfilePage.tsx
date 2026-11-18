import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { DiscardChangesModal } from '../../components/common/DiscardChangesModal';
import { PortfolioItem } from '../../types';
import {
  User,
  Briefcase,
  Globe,
  Euro,
  ShieldCheck,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  Lock,
  Layers,
} from 'lucide-react';

const SERVICE_OPTIONS = [
  'Web Applications',
  'UI/UX Design',
  'Brand Identity & Systems',
  'Mobile Applications (iOS / Android)',
  'E-commerce Architecture',
  'Design Systems & Prototyping',
  'Technical Architecture & APIs',
  'SEO & Growth Engineering',
];

const COMMON_COUNTRIES = [
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'United States', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Greece', label: 'Greece' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Other', label: 'Other' },
];

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (London, Dublin)' },
  { value: 'UTC+1', label: 'UTC+1 (Berlin, Paris, Amsterdam)' },
  { value: 'UTC+2', label: 'UTC+2 (Athens, Helsinki, Cairo)' },
  { value: 'UTC-5', label: 'UTC-5 (New York, Toronto - EST)' },
  { value: 'UTC-8', label: 'UTC-8 (San Francisco - PST)' },
  { value: 'UTC+8', label: 'UTC+8 (Singapore, Hong Kong)' },
];

export const ProfessionalProfilePage: React.FC = () => {
  const { currentUser, userProfile, professionalProfile, refreshData } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(
    professionalProfile?.displayName || userProfile?.displayName || ''
  );
  const [professionalTitle, setProfessionalTitle] = useState(
    professionalProfile?.professionalTitle || ''
  );
  const [shortBio, setShortBio] = useState(professionalProfile?.shortBio || '');
  const [country, setCountry] = useState(professionalProfile?.country || 'United Kingdom');
  const [timezone, setTimezone] = useState(professionalProfile?.timezone || 'UTC');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(
    professionalProfile?.yearsOfExperience || 5
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(
    professionalProfile?.primaryServices || ['Web Applications']
  );
  const [skillsInput, setSkillsInput] = useState<string>(
    (professionalProfile?.skills || []).join(', ')
  );
  const [website, setWebsite] = useState(professionalProfile?.website || '');
  const [floorBudgetEur, setFloorBudgetEur] = useState<number>(
    professionalProfile ? Math.round(professionalProfile.minimumBudgetMinor / 100) : 2500
  );

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(
    professionalProfile?.portfolioItems || []
  );
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [newPortfolioUrl, setNewPortfolioUrl] = useState('');
  const [newPortfolioYear, setNewPortfolioYear] = useState('');
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const resetToPersisted = () => {
    if (professionalProfile) {
      setDisplayName(professionalProfile.displayName || userProfile?.displayName || '');
      setProfessionalTitle(professionalProfile.professionalTitle || '');
      setShortBio(professionalProfile.shortBio || '');
      setCountry(professionalProfile.country || 'United Kingdom');
      setTimezone(professionalProfile.timezone || 'UTC');
      setYearsOfExperience(professionalProfile.yearsOfExperience || 1);
      setSelectedServices(professionalProfile.primaryServices || ['Web Applications']);
      setSkillsInput((professionalProfile.skills || []).join(', '));
      setWebsite(professionalProfile.website || '');
      setFloorBudgetEur(Math.round(professionalProfile.minimumBudgetMinor / 100));
      setPortfolioItems(professionalProfile.portfolioItems || []);
    } else {
      setDisplayName(userProfile?.displayName || '');
      setProfessionalTitle('');
      setShortBio('');
      setCountry('United Kingdom');
      setTimezone('UTC');
      setYearsOfExperience(1);
      setSelectedServices(['Web Applications']);
      setSkillsInput('');
      setWebsite('');
      setFloorBudgetEur(2500);
      setPortfolioItems([]);
    }
    setShowAddPortfolio(false);
    setNewPortfolioTitle('');
    setNewPortfolioDesc('');
    setNewPortfolioUrl('');
    setNewPortfolioYear('');
    setIsDirty(false);
    setError(null);
    setSuccessMessage(null);
  };

  useEffect(() => {
    if (professionalProfile && !isDirty) {
      resetToPersisted();
    }
  }, [professionalProfile, userProfile, isDirty]);

  const markDirty = () => {
    setIsDirty(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleServiceToggle = (srv: string) => {
    markDirty();
    if (selectedServices.includes(srv)) {
      if (selectedServices.length <= 1) {
        setError('At least one primary service must be selected.');
        return;
      }
      setSelectedServices(selectedServices.filter((s) => s !== srv));
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const handleAddPortfolioItem = () => {
    if (!newPortfolioTitle.trim()) {
      setError('Please provide a project title.');
      return;
    }
    if (!newPortfolioDesc.trim()) {
      setError('Please provide a brief description for this portfolio highlight.');
      return;
    }

    const newItem: PortfolioItem = {
      id: `port-${Date.now()}`,
      title: newPortfolioTitle.trim(),
      description: newPortfolioDesc.trim(),
      liveUrl: newPortfolioUrl.trim() || undefined,
      year: newPortfolioYear.trim() || undefined,
    };

    setPortfolioItems([...portfolioItems, newItem]);
    setNewPortfolioTitle('');
    setNewPortfolioDesc('');
    setNewPortfolioUrl('');
    setNewPortfolioYear('');
    setShowAddPortfolio(false);
    markDirty();
  };

  const handleRemovePortfolioItem = (id: string) => {
    setPortfolioItems(portfolioItems.filter((item) => item.id !== id));
    markDirty();
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardModal(true);
      return;
    }
    navigate('/professional');
  };

  const handleConfirmDiscard = () => {
    resetToPersisted();
    setShowDiscardModal(false);
    navigate('/professional');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);
    setSuccessMessage(null);

    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName || trimmedDisplayName.length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }

    const trimmedTitle = professionalTitle.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      setError('Professional title must be at least 3 characters (e.g. Lead Product Designer).');
      return;
    }

    const trimmedBio = shortBio.trim();
    if (!trimmedBio || trimmedBio.length < 10) {
      setError('Please provide a bio of at least 10 characters summarizing your practice.');
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please select at least one primary service discipline.');
      return;
    }

    const parsedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedSkills.length === 0) {
      setError('Please provide at least one key skill or technology.');
      return;
    }

    if (website.trim()) {
      const site = website.trim();
      if (!site.startsWith('http://') && !site.startsWith('https://') && !site.includes('.')) {
        setError('Please enter a valid website URL (e.g. https://myportfolio.com).');
        return;
      }
    }

    const budgetEur = Number(floorBudgetEur);
    if (isNaN(budgetEur) || budgetEur < 0) {
      setError('Please enter a valid floor project budget in EUR.');
      return;
    }

    setIsSubmitting(true);
    try {
      await profileService.updateProfessionalProfile(currentUser.uid, {
        displayName: trimmedDisplayName,
        professionalTitle: trimmedTitle,
        shortBio: trimmedBio,
        country,
        timezone,
        languages: professionalProfile?.languages || ['English'],
        primaryServices: selectedServices,
        skills: parsedSkills,
        yearsOfExperience: Number(yearsOfExperience) || 1,
        minimumBudgetMinor: Math.round(budgetEur * 100),
        currency: 'EUR',
        website: website.trim() || undefined,
        portfolioItems: portfolioItems.length > 0 ? portfolioItems : undefined,
      });

      await refreshData();

      setIsDirty(false);
      setSuccessMessage('Profile updated successfully.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to update professional profile:', err);
      setError(err.message || 'An unexpected error occurred while saving your profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verificationStatus = professionalProfile?.verificationStatus || 'draft';
  const verificationBadgeProps = {
    verified: { variant: 'success' as const, label: 'Verified Practitioner' },
    under_review: { variant: 'warning' as const, label: 'Curation Review Pending' },
    submitted: { variant: 'warning' as const, label: 'Application Submitted' },
    draft: { variant: 'neutral' as const, label: 'Profile Draft' },
    rejected: { variant: 'danger' as const, label: 'Application Declined' },
    suspended: { variant: 'danger' as const, label: 'Account Suspended' },
  }[verificationStatus] || { variant: 'neutral' as const, label: verificationStatus };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Professional Workspace', to: '/professional' },
        { label: 'Practitioner Profile' },
      ]}
      title="Practitioner Profile"
      subtitle="Manage your curated presentation, core disciplines, portfolio highlights, and matching floor budget."
      action={
        <Button variant="outline" size="sm" onClick={handleCancel}>
          Back to Workspace
        </Button>
      }
    >
      <div className="max-w-4xl space-y-8">
        {successMessage && (
          <div id="professional-profile-success">
            <Alert
              variant="success"
              title={successMessage}
              onDismiss={() => setSuccessMessage(null)}
            >
              Your updated capabilities, services, and floor budget are active for future project matching.
            </Alert>
          </div>
        )}

        {error && (
          <div id="professional-profile-error">
            <Alert variant="error" title="Unable to save profile" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {/* Read-Only Governance & Verification Status Bar */}
        <Card className="p-6 bg-[var(--color-surface-secondary)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Governance Status
                  </span>
                  <Badge variant={verificationBadgeProps.variant} size="sm">
                    {verificationBadgeProps.label}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] tabular-nums mt-0.5">
                  Completed Projects:{' '}
                  <strong className="font-semibold text-[var(--color-text-primary)]">
                    {professionalProfile?.completedProjectCount ?? 0}
                  </strong>
                  {typeof professionalProfile?.averageRating === 'number' && (
                    <span className="ml-3">
                      Client Rating:{' '}
                      <strong className="font-semibold text-[var(--color-text-primary)]">
                        ★ {professionalProfile.averageRating.toFixed(1)}
                      </strong>
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <Lock className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
              <span>Verification and completion metrics are governed by Alongby curation.</span>
            </div>
          </div>
        </Card>

        {/* Link to Live Availability */}
        <Card className="p-5 sm:p-6 bg-[var(--color-surface)] border-[var(--color-border-strong)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] shrink-0">
              <Calendar className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="typo-card-title text-[var(--color-text-primary)]">
                Live Availability &amp; Capacity
              </h2>
              <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
                Earliest start dates and concurrent project limits are managed in your workspace availability controls.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/professional?tab=availability')}
          >
            Manage Availability
          </Button>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identity & Headline Card */}
          <Card className="p-6 sm:p-8">
            <div className="border-b border-[var(--color-border)] pb-4 mb-6">
              <h2 className="flex items-center gap-2 typo-section-heading text-[var(--color-text-primary)]">
                <User className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                <span>Practitioner Identity &amp; Headline</span>
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Your identity presented on curated shortlists, commercial proposals, and agreements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Input
                  id="prof-display-name"
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. Elena Rostova"
                  required
                  helperText="Full practitioner name shown on proposals and agreements."
                />
              </div>

              <div>
                <Input
                  id="prof-title"
                  label="Professional Title / Headline"
                  value={professionalTitle}
                  onChange={(e) => {
                    setProfessionalTitle(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. Senior Full-Stack Architect & UI Designer"
                  required
                  helperText="Concise summary of your primary craft."
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  id="prof-bio"
                  label="Professional Biography & Summary"
                  value={shortBio}
                  onChange={(e) => {
                    setShortBio(e.target.value);
                    markDirty();
                  }}
                  rows={4}
                  placeholder="Describe your design and engineering approach, domain focus, and delivery methodology..."
                  required
                  helperText="Helps clients understand how you structure collaboration and execution."
                />
              </div>

              <div>
                <Input
                  id="prof-website"
                  label="Portfolio Website / Link"
                  value={website}
                  onChange={(e) => {
                    setWebsite(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. https://elenadesign.io"
                  helperText="Personal portfolio, studio site, or GitHub profile."
                  leftIcon={<Globe className="w-4 h-4 text-[var(--color-text-muted)]" />}
                />
              </div>

              <div>
                <Input
                  id="prof-experience"
                  type="number"
                  min={0}
                  max={50}
                  label="Years of Experience"
                  value={yearsOfExperience}
                  onChange={(e) => {
                    setYearsOfExperience(Number(e.target.value));
                    markDirty();
                  }}
                  className="tabular-nums"
                  helperText="Experience considered in curated matching evaluation."
                />
              </div>

              <div>
                <Select
                  id="prof-country"
                  label="Location / Country"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    markDirty();
                  }}
                  options={COMMON_COUNTRIES}
                  helperText="Primary operating country."
                />
              </div>

              <div>
                <Select
                  id="prof-timezone"
                  label="Working Timezone"
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    markDirty();
                  }}
                  options={COMMON_TIMEZONES}
                  helperText="Supports client working-hour overlap alignment."
                />
              </div>
            </div>
          </Card>

          {/* Services & Matching Preferences Card */}
          <Card className="p-6 sm:p-8">
            <div className="border-b border-[var(--color-border)] pb-4 mb-6">
              <h2 className="flex items-center gap-2 typo-section-heading text-[var(--color-text-primary)]">
                <Briefcase className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                <span>Services, Skills &amp; Engagement Floor</span>
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Parameters used by Alongby matching to evaluate project fit.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-2">
                  Primary Services &amp; Disciplines
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SERVICE_OPTIONS.map((srv) => {
                    const isSelected = selectedServices.includes(srv);
                    return (
                      <button
                        key={srv}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleServiceToggle(srv)}
                        className={`text-left p-3.5 rounded-[var(--radius-button)] border transition-colors text-[13px] font-medium flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                          isSelected
                            ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]'
                            : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]'
                        }`}
                      >
                        <span>{srv}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[var(--color-primary-text)] shrink-0 ml-2" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                  Select at least one discipline you actively deliver.
                </p>
              </div>

              <div>
                <Input
                  id="prof-skills"
                  label="Skills, Methodologies & Tech Stack"
                  value={skillsInput}
                  onChange={(e) => {
                    setSkillsInput(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. React, TypeScript, Figma, Tailwind CSS, GraphQL, PostgreSQL"
                  helperText="Comma-separated list of core technologies and competencies."
                />
                {skillsInput
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean).length > 0 && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                    {skillsInput
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <div className="max-w-md">
                  <Input
                    id="prof-floor-budget"
                    type="number"
                    min={0}
                    step={100}
                    label="Minimum Project Floor Budget (EUR)"
                    value={floorBudgetEur}
                    onChange={(e) => {
                      setFloorBudgetEur(Number(e.target.value));
                      markDirty();
                    }}
                    className="tabular-nums"
                    helperText="Opportunities below this baseline are flagged during curation review."
                    leftIcon={<Euro className="w-4 h-4 text-[var(--color-text-muted)]" />}
                  />
                  <div className="mt-2 text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <span>Active Floor:</span>
                    <strong className="text-[var(--color-text-primary)] font-semibold tabular-nums">
                      €{Number(floorBudgetEur || 0).toLocaleString()} EUR
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Portfolio Highlights Card */}
          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between border-b border-[var(--color-border)] pb-4 mb-6 gap-4">
              <div>
                <h2 className="flex items-center gap-2 typo-section-heading text-[var(--color-text-primary)]">
                  <Layers className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                  <span>Portfolio &amp; Project Highlights</span>
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Selected case studies shown to clients comparing curated shortlists.
                </p>
              </div>

              {!showAddPortfolio && (
                <Button
                  id="prof-add-portfolio-btn"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPortfolio(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Project
                </Button>
              )}
            </div>

            {portfolioItems.length === 0 && !showAddPortfolio && (
              <div className="text-center py-8 px-4 border border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-card)] bg-[var(--color-surface-secondary)]">
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  No portfolio highlights added yet. Adding 1–3 relevant case studies helps clients evaluate your work.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPortfolio(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Project Highlight
                </Button>
              </div>
            )}

            {portfolioItems.length > 0 && (
              <div className="space-y-3 mb-6">
                {portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] break-words">
                          {item.title}
                        </h3>
                        {item.year && (
                          <span className="text-xs text-[var(--color-text-secondary)] font-medium tabular-nums">
                            ({item.year})
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                        {item.description}
                      </p>
                      {item.liveUrl && (
                        <a
                          href={item.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--color-text-primary)] font-medium mt-2 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm"
                        >
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          <span>View Live Case Study</span>
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePortfolioItem(item.id)}
                      aria-label={`Remove portfolio highlight ${item.title}`}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-error-text)] p-2 rounded-[var(--radius-button)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title="Remove highlight"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddPortfolio && (
              <div className="p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    New Project Highlight
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddPortfolio(false)}
                    className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm px-1"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Project Title"
                    value={newPortfolioTitle}
                    onChange={(e) => setNewPortfolioTitle(e.target.value)}
                    placeholder="e.g. FinTech Mobile Banking Redesign"
                    required
                  />

                  <Input
                    label="Year / Period (Optional)"
                    value={newPortfolioYear}
                    onChange={(e) => setNewPortfolioYear(e.target.value)}
                    placeholder="e.g. 2025"
                    className="tabular-nums"
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Live Project or Case Study URL (Optional)"
                      value={newPortfolioUrl}
                      onChange={(e) => setNewPortfolioUrl(e.target.value)}
                      placeholder="e.g. https://studio.example.com/case-study"
                      leftIcon={<Globe className="w-4 h-4 text-[var(--color-text-muted)]" />}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Textarea
                      label="Key Deliverables & Impact Description"
                      value={newPortfolioDesc}
                      onChange={(e) => setNewPortfolioDesc(e.target.value)}
                      rows={2}
                      placeholder="Summarize the scope delivered and measurable outcome..."
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddPortfolio(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddPortfolioItem}
                  >
                    Add Highlight
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Historical Consistency Notice */}
          <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-start gap-3.5 text-[var(--color-text-secondary)]">
            <div className="w-8 h-8 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0 text-[var(--color-text-primary)]">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="text-[13px] leading-relaxed">
              <span className="font-semibold text-[var(--color-text-primary)] block mb-0.5">
                Future Matching &amp; Snapshot Integrity
              </span>
              Updates to your primary services, skills, location, and minimum budget calibrate future matching invitations. Historical snapshots in already-published shortlists, proposals, and signed agreements remain preserved.
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--color-warning-text)] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  All changes saved
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                id="prof-profile-cancel"
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                id="prof-profile-save"
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting || !isDirty}
                className="w-full sm:w-auto min-w-[140px]"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>

      <DiscardChangesModal
        isOpen={showDiscardModal}
        onKeepEditing={() => setShowDiscardModal(false)}
        onDiscard={handleConfirmDiscard}
      />
    </DashboardLayout>
  );
};
