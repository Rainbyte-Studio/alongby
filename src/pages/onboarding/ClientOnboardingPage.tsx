import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { auditService } from '../../services/auditService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
            <span>Step 1 of 1: Client Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-neutral-900">
            Welcome to Alongby
          </h1>
          <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
            Tell us about yourself and your organization so our curation team can match you with the right professionals.
          </p>
        </div>

        <Card className="p-8">
          {error && (
            <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Your Full Name"
              required
              placeholder="e.g. Sarah Jenkins"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company / Studio (Optional)"
                placeholder="e.g. Acme Studio"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                label="Website (Optional)"
                placeholder="https://example.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
            </div>

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

            <div className="pt-4 border-t border-neutral-100 flex items-center justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Complete & Go to Dashboard
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
