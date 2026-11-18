import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { DiscardChangesModal } from '../../components/common/DiscardChangesModal';
import { PortfolioItem } from '../../types';
import {
  User,
  Briefcase,
  Globe,
  MapPin,
  Clock,
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
  Sparkles,
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

  // Form states
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

  // Portfolio items
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

  // Authoritative reset to persisted profile values
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

  // Synchronize when professionalProfile loads if not dirty
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
    // No unsaved changes: navigate immediately
    navigate('/professional');
  };

  const handleConfirmDiscard = () => {
    // 1. Discard all unsaved local form changes and restore last persisted profile values
    resetToPersisted();
    // 2. Clear modal state
    setShowDiscardModal(false);
    // 3. Navigate back to professional workspace
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

      // Synchronize in-memory auth state so ProfessionalDashboard updates immediately
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
      title="Professional Profile"
      subtitle="Manage your public practitioner profile, capabilities, and matching preferences."
      showBack={true}
      onBack={handleCancel}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Success Alert */}
        {successMessage && (
          <div
            id="professional-profile-success"
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-900"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{successMessage}</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your updated capabilities, services, and floor budget are active for future project matching.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/professional')}
              className="bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
            >
              Go to Workspace
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            id="professional-profile-error"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Unable to save profile</h3>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Read-Only Governance & Verification Status Bar */}
        <Card className="p-6 bg-neutral-50/70 border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-neutral-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Governance Status
                  </span>
                  <Badge variant={verificationBadgeProps.variant} size="sm">
                    {verificationBadgeProps.label}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Completed Projects: <strong className="text-neutral-700">{professionalProfile?.completedProjectCount ?? 0}</strong>
                  {typeof professionalProfile?.averageRating === 'number' && (
                    <span className="ml-3">
                      Client Rating: <strong className="text-neutral-700">★ {professionalProfile.averageRating.toFixed(1)}</strong>
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Curation metrics are managed directly by Alongby and cannot be manually modified.</span>
            </div>
          </div>
        </Card>

        {/* Fast-Moving Operational State Notice: Link to Live Availability */}
        <div className="p-5 rounded-xl bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Live Availability & Capacity</h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Fast-moving operational capacity and next start dates are managed separately from your practitioner profile.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/professional?tab=availability')}
            className="border-neutral-700 text-white hover:bg-neutral-800 whitespace-nowrap"
          >
            Manage Availability
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identity & Headline Card */}
          <Card className="p-6 sm:p-8">
            <div className="border-b border-neutral-100 pb-4 mb-6">
              <div className="flex items-center gap-2 text-neutral-900 font-serif font-bold text-lg">
                <User className="w-5 h-5 text-neutral-600" />
                <span>Practitioner Identity & Headline</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Your public identity presented to matched clients and curation review panels.
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
                  helperText="Your full practitioner name shown on proposals and contracts."
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
                  helperText="A concise summary of your primary craft."
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
                  placeholder="Describe your design and engineering philosophy, domain focus, and key accomplishments..."
                  required
                  helperText="Helps clients understand how you approach collaboration and technical delivery."
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
                  helperText="Personal portfolio, studio website, or GitHub profile."
                  leftIcon={<Globe className="w-4 h-4 text-neutral-400" />}
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
                  helperText="Verified experience considered in matching algorithm scoring."
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
                  helperText="Facilitates scheduling and client overlap calculations."
                />
              </div>
            </div>
          </Card>

          {/* Services & Matching Preferences Card */}
          <Card className="p-6 sm:p-8">
            <div className="border-b border-neutral-100 pb-4 mb-6">
              <div className="flex items-center gap-2 text-neutral-900 font-serif font-bold text-lg">
                <Briefcase className="w-5 h-5 text-neutral-600" />
                <span>Services, Skills & Floor Budget</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Authoritative parameters used directly by the Alongby matching engine to evaluate project suitability.
              </p>
            </div>

            <div className="space-y-6">
              {/* Primary Services Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Primary Services & Disciplines (select all that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SERVICE_OPTIONS.map((srv) => {
                    const isSelected = selectedServices.includes(srv);
                    return (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => handleServiceToggle(srv)}
                        className={`text-left p-3 rounded-lg border transition-all text-xs font-medium flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span>{srv}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-neutral-400 mt-1.5">
                  Updating primary services directly calibrates project category eligibility in the matching engine.
                </p>
              </div>

              {/* Skills Input with chips */}
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
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {skillsInput
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 text-[11px] font-medium border border-neutral-200/80"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              </div>

              {/* Minimum Floor Budget */}
              <div className="pt-4 border-t border-neutral-100">
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
                    helperText="Opportunities below this threshold will be flagged as budget stretch before routing."
                    leftIcon={<Euro className="w-4 h-4 text-neutral-400" />}
                  />
                  <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
                    <span>Floor Level:</span>
                    <strong className="text-neutral-900 font-medium">
                      €{Number(floorBudgetEur || 0).toLocaleString()} EUR
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Portfolio Highlights Card */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-neutral-900 font-serif font-bold text-lg">
                  <Layers className="w-5 h-5 text-neutral-600" />
                  <span>Portfolio & Project Highlights</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Curated case studies displayed to clients reviewing proposal shortlists.
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

            {/* Existing Portfolio Items */}
            {portfolioItems.length === 0 && !showAddPortfolio && (
              <div className="text-center py-8 px-4 border border-dashed border-neutral-200 rounded-xl">
                <p className="text-xs text-neutral-500 mb-3">
                  No portfolio highlights added yet. Adding 1–3 past project highlights increases client selection confidence.
                </p>
                <Button
                  type="button"
                  variant="secondary"
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
                    className="p-4 rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-neutral-900 truncate">
                          {item.title}
                        </h4>
                        {item.year && (
                          <span className="text-[11px] text-neutral-400 font-medium">
                            ({item.year})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                      {item.liveUrl && (
                        <a
                          href={item.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-800 hover:text-neutral-950 font-medium mt-2 underline underline-offset-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Live Case Study</span>
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePortfolioItem(item.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title="Remove highlight"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Portfolio Highlight Form */}
            {showAddPortfolio && (
              <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60">
                  <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                    New Project Highlight
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddPortfolio(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
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
                    placeholder="e.g. 2024"
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Live Project or Case Study URL (Optional)"
                      value={newPortfolioUrl}
                      onChange={(e) => setNewPortfolioUrl(e.target.value)}
                      placeholder="e.g. https://behance.net/gallery/..."
                      leftIcon={<Globe className="w-4 h-4 text-neutral-400" />}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Textarea
                      label="Key Deliverables & Impact Description"
                      value={newPortfolioDesc}
                      onChange={(e) => setNewPortfolioDesc(e.target.value)}
                      rows={2}
                      placeholder="Summarize the core problem solved, architecture delivered, and business impact achieved..."
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

          {/* Historical Consistency & Governance Notice */}
          <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3.5 text-neutral-700">
            <div className="w-8 h-8 rounded-lg bg-neutral-200/60 flex items-center justify-center shrink-0 text-neutral-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs leading-relaxed">
              <span className="font-semibold text-neutral-900 block mb-0.5">
                Future Matching & Commercial Consistency
              </span>
              Updates to your primary services, skills, location, and minimum budget will calibrate future project
              matching opportunities. Historical snapshots in already-submitted quotes, accepted proposals, and executed
              contracts remain preserved and uncompromised.
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-neutral-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
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
                loading={isSubmitting}
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
