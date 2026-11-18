import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { auditService } from '../../services/auditService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { ArrowRight } from 'lucide-react';

const COMMON_COUNTRIES = [
  { value: '', label: 'Select your country' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'United States', label: 'United States' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Other', label: 'Other' },
];

const COMMON_TIMEZONES = [
  { value: '', label: 'Select your timezone' },
  { value: 'UTC', label: 'UTC (London, Dublin, Lisbon)' },
  { value: 'UTC+1', label: 'UTC+1 (Berlin, Paris, Amsterdam, Rome)' },
  { value: 'UTC+2', label: 'UTC+2 (Athens, Helsinki, Cairo)' },
  { value: 'UTC-5', label: 'UTC-5 (New York, Toronto - EST)' },
  { value: 'UTC-6', label: 'UTC-6 (Chicago, Dallas - CST)' },
  { value: 'UTC-8', label: 'UTC-8 (San Francisco, Los Angeles - PST)' },
  { value: 'UTC+8', label: 'UTC+8 (Singapore, Hong Kong, Perth)' },
  { value: 'UTC+10', label: 'UTC+10 (Sydney, Melbourne)' },
];

export const ClientOnboardingPage: React.FC = () => {
  const { currentUser, userProfile, refreshData } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(userProfile?.displayName || '');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [timezone, setTimezone] = useState('UTC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!country) {
      setError('Please select your country.');
      return;
    }
    if (!timezone) {
      setError('Please select your primary timezone.');
      return;
    }

    setIsSubmitting(true);
    try {
      const clientData: {
        fullName: string;
        country: string;
        timezone: string;
        companyName?: string;
        companyWebsite?: string;
      } = {
        fullName: fullName.trim(),
        country,
        timezone,
      };

      if (companyName.trim()) {
        clientData.companyName = companyName.trim();
      }
      if (companyWebsite.trim()) {
        clientData.companyWebsite = companyWebsite.trim();
      }

      await profileService.saveClientProfile(currentUser.uid, clientData);

      await auditService.logEvent(
        currentUser.uid,
        'client',
        'client_onboarding_completed',
        'clientProfile',
        currentUser.uid
      );

      await refreshData();
      navigate('/client');
    } catch (err: any) {
      console.error('Error saving client profile:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[var(--color-bg-app)] flex items-center justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center space-y-2.5">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] tabular-nums">
            Step 1 of 1 · Client Workspace Setup
          </p>
          <h1 className="typo-page-title text-[var(--color-text-primary)]">
            Welcome to Alongby
          </h1>
          <p className="text-sm sm:text-[15px] text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
            Share your contact and organization context so our curation team can match your briefs with suitable specialists.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {error && (
            <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="onboarding-client-name"
              label="Your Full Name"
              required
              placeholder="e.g. Sarah Jenkins"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              helperText="Used on project proposals and service agreements."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="onboarding-client-company"
                label="Company or Studio (Optional)"
                placeholder="e.g. Acme Studio"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                id="onboarding-client-website"
                label="Website (Optional)"
                placeholder="https://example.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="onboarding-client-country"
                label="Country"
                required
                options={COMMON_COUNTRIES}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
              <Select
                id="onboarding-client-timezone"
                label="Primary Timezone"
                required
                options={COMMON_TIMEZONES}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>

            <div className="pt-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-[var(--color-text-secondary)]">
                You can update these details anytime in Client Profile.
              </span>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Complete &amp; Enter Workspace
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
