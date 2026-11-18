import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { availabilityService } from '../../services/availabilityService';
import { auditService } from '../../services/auditService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { ArrowRight, AlertCircle, Check } from 'lucide-react';
import { AvailabilityStatus } from '../../types';

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

const AVAILABILITY_STATUS_OPTIONS = [
  { value: 'available', label: 'Available — Ready for new projects' },
  { value: 'limited', label: 'Limited — 1 spot remaining' },
  { value: 'fully_booked', label: 'Fully Booked — Available soon' },
  { value: 'unavailable', label: 'Unavailable — Not taking projects' },
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

export const ProfessionalOnboardingPage: React.FC = () => {
  const { currentUser, userProfile, refreshData } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [timezone, setTimezone] = useState('UTC');
  const [selectedServices, setSelectedServices] = useState<string[]>(['Web Applications', 'UI/UX Design']);
  const [skillsInput, setSkillsInput] = useState('React, TypeScript, Figma, Tailwind CSS, Node.js');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(6);
  const [minBudgetEur, setMinBudgetEur] = useState<number>(3000);
  
  // Availability fields
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('available');
  const [nextAvailableDate, setNextAvailableDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [maxProjects, setMaxProjects] = useState<number>(2);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleService = (srv: string) => {
    if (selectedServices.includes(srv)) {
      setSelectedServices(selectedServices.filter((s) => s !== srv));
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);

    if (!displayName.trim()) {
      setError('Please provide your display name.');
      return;
    }
    if (!professionalTitle.trim()) {
      setError('Please provide your professional title (e.g. Senior Product Designer).');
      return;
    }
    if (!shortBio.trim()) {
      setError('Please write a brief bio summarizing your expertise and focus.');
      return;
    }
    if (selectedServices.length === 0) {
      setError('Please select at least one primary service.');
      return;
    }
    if (!nextAvailableDate) {
      setError('Please specify your next available start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const skillsArray = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Save Professional Profile
      await profileService.saveProfessionalProfile(currentUser.uid, {
        displayName: displayName.trim(),
        professionalTitle: professionalTitle.trim(),
        shortBio: shortBio.trim(),
        country,
        timezone,
        languages: ['English'],
        primaryServices: selectedServices,
        skills: skillsArray,
        yearsOfExperience: Number(yearsOfExperience) || 1,
        minimumBudgetMinor: Math.round(Number(minBudgetEur) * 100),
        currency: 'EUR',
      });

      // Save Availability
      await availabilityService.saveAvailability(currentUser.uid, {
        availabilityStatus,
        nextAvailableDate,
        maximumConcurrentProjects: Number(maxProjects) || 2,
      });

      // Audit event
      await auditService.logEvent(
        currentUser.uid,
        'professional',
        'professional_onboarding_completed',
        'professionalProfile',
        currentUser.uid
      );

      await refreshData();
      navigate('/professional');
    } catch (err: any) {
      console.error('Error saving professional profile:', err);
      setError(err.message || 'Failed to save professional profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[var(--color-bg-app)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-2.5">
            Professional Profile &amp; Availability
          </p>
          <h1 className="typo-page-title text-[var(--color-text-primary)]">
            Complete your Professional Profile
          </h1>
          <p className="mt-2 text-sm sm:text-[15px] text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
            Alongby curates matches using verified skills, experience, and structured availability. You will not be displayed in a public directory.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3 rounded-[var(--radius-button)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-xs text-[var(--color-error-text)] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-error)]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display Name"
                required
                placeholder="e.g. Julian Hayes"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Input
                label="Professional Title"
                required
                placeholder="e.g. Lead Brand & Web Designer"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
              />
            </div>

            <Textarea
              label="Professional Bio"
              required
              rows={3}
              placeholder="Describe your craft, technical stack, and the types of client briefs you specialize in delivering..."
              value={shortBio}
              onChange={(e) => setShortBio(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Country"
                required
                options={COMMON_COUNTRIES}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
              <Select
                label="Timezone"
                required
                options={COMMON_TIMEZONES}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>

            {/* Primary Services Multi-select */}
            <div>
              <label className="block font-sans text-[13px] font-medium text-[var(--color-text-primary)] mb-2">
                Primary Services Offered <span className="text-[var(--color-error)]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SERVICE_OPTIONS.map((srv) => {
                  const isSelected = selectedServices.includes(srv);
                  return (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => toggleService(srv)}
                      className={`px-3.5 py-2.5 min-h-[42px] text-[13px] font-medium rounded-[var(--radius-button)] border text-left flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                        isSelected
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                          : 'border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)] bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                      }`}
                    >
                      <span>{srv}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Core Skills & Technologies (comma separated)"
              placeholder="e.g. Next.js, TypeScript, PostgreSQL, Figma, UI Systems"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Years of Professional Experience"
                type="number"
                min="1"
                max="50"
                className="tabular-nums"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(parseInt(e.target.value, 10) || 1)}
              />
              <Input
                label="Minimum Project Budget (€ EUR)"
                type="number"
                step="250"
                min="500"
                className="tabular-nums"
                value={minBudgetEur}
                onChange={(e) => setMinBudgetEur(parseInt(e.target.value, 10) || 1000)}
                helperText="Indicative floor for matched project scopes"
              />
            </div>

            {/* Availability Setup */}
            <div className="pt-6 border-t border-[var(--color-border)]">
              <h3 className="typo-card-title text-[var(--color-text-primary)] mb-1">
                Initial Availability Settings
              </h3>
              <p className="text-[13px] text-[var(--color-text-secondary)] mb-4 leading-relaxed">
                Alongby uses structured availability to ensure you are only matched with projects when you have real delivery capacity.
              </p>

              <div className="space-y-4">
                <Select
                  label="Current Availability Status"
                  options={AVAILABILITY_STATUS_OPTIONS}
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Next Available Start Date"
                    type="date"
                    required
                    className="tabular-nums"
                    value={nextAvailableDate}
                    onChange={(e) => setNextAvailableDate(e.target.value)}
                  />
                  <Input
                    label="Maximum Concurrent Projects"
                    type="number"
                    min="1"
                    max="10"
                    className="tabular-nums"
                    value={maxProjects}
                    onChange={(e) => setMaxProjects(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Submit Profile &amp; Enter Workspace
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
