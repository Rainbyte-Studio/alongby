import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { DiscardChangesModal } from '../../components/common/DiscardChangesModal';
import {
  Building,
  Globe,
  User,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';

const COMMON_COUNTRIES = [
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
  { value: 'Greece', label: 'Greece' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Other', label: 'Other' },
];

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (London, Dublin, Lisbon)' },
  { value: 'UTC+1', label: 'UTC+1 (Berlin, Paris, Amsterdam, Rome)' },
  { value: 'UTC+2', label: 'UTC+2 (Athens, Helsinki, Cairo)' },
  { value: 'UTC-5', label: 'UTC-5 (New York, Toronto - EST)' },
  { value: 'UTC-6', label: 'UTC-6 (Chicago, Dallas - CST)' },
  { value: 'UTC-8', label: 'UTC-8 (San Francisco, Los Angeles - PST)' },
  { value: 'UTC+8', label: 'UTC+8 (Singapore, Hong Kong, Perth)' },
  { value: 'UTC+10', label: 'UTC+10 (Sydney, Melbourne)' },
];

export const ClientProfilePage: React.FC = () => {
  const { currentUser, userProfile, clientProfile, refreshData } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(
    clientProfile?.fullName || userProfile?.displayName || ''
  );
  const [companyName, setCompanyName] = useState(clientProfile?.companyName || '');
  const [companyWebsite, setCompanyWebsite] = useState(clientProfile?.companyWebsite || '');
  const [country, setCountry] = useState(clientProfile?.country || 'United Kingdom');
  const [timezone, setTimezone] = useState(clientProfile?.timezone || 'UTC');
  const [phone, setPhone] = useState(clientProfile?.phone || '');
  const [billingEmail, setBillingEmail] = useState(
    clientProfile?.billingEmail || currentUser?.email || ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const resetToPersisted = () => {
    setFullName(clientProfile?.fullName || userProfile?.displayName || '');
    setCompanyName(clientProfile?.companyName || '');
    setCompanyWebsite(clientProfile?.companyWebsite || '');
    setCountry(clientProfile?.country || 'United Kingdom');
    setTimezone(clientProfile?.timezone || 'UTC');
    setPhone(clientProfile?.phone || '');
    setBillingEmail(clientProfile?.billingEmail || currentUser?.email || '');
    setIsDirty(false);
    setError(null);
    setSuccessMessage(null);
  };

  useEffect(() => {
    if (clientProfile && !isDirty) {
      resetToPersisted();
    }
  }, [clientProfile, userProfile, currentUser, isDirty]);

  const handleFieldChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setIsDirty(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardModal(true);
      return;
    }
    navigate('/client');
  };

  const handleConfirmDiscard = () => {
    resetToPersisted();
    setShowDiscardModal(false);
    navigate('/client');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);
    setSuccessMessage(null);

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setError('Please provide your display / contact name.');
      return;
    }
    if (trimmedFullName.length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }

    if (companyWebsite.trim()) {
      const site = companyWebsite.trim();
      if (!site.startsWith('http://') && !site.startsWith('https://') && !site.includes('.')) {
        setError('Please enter a valid website address (e.g. https://acme.example.com).');
        return;
      }
    }

    if (billingEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(billingEmail.trim())) {
        setError('Please enter a valid billing email address.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await profileService.updateClientProfile(currentUser.uid, {
        fullName: trimmedFullName,
        companyName: companyName.trim() || undefined,
        companyWebsite: companyWebsite.trim() || undefined,
        country,
        timezone,
        phone: phone.trim() || undefined,
        billingEmail: billingEmail.trim() || undefined,
      });

      await refreshData();

      setIsDirty(false);
      setSuccessMessage('Profile updated successfully.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to update client profile:', err);
      setError(err.message || 'An unexpected error occurred while saving your profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Client Workspace', to: '/client' },
        { label: 'Client Profile' },
      ]}
      title="Client Profile"
      subtitle="Manage your contact and organization details used across your Alongby projects and agreements."
      action={
        <Button variant="outline" size="sm" onClick={handleCancel}>
          Back to Workspace
        </Button>
      }
    >
      <div className="max-w-4xl space-y-8">
        {successMessage && (
          <div id="client-profile-success">
            <Alert
              variant="success"
              title={successMessage}
              onDismiss={() => setSuccessMessage(null)}
            >
              Your updated company and contact information is active for upcoming project briefs, proposals, and agreements.
            </Alert>
          </div>
        )}

        {error && (
          <div id="client-profile-error">
            <Alert variant="error" title="Unable to save profile" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identity & Contact Card */}
          <Card className="p-6 sm:p-8">
            <div className="border-b border-[var(--color-border)] pb-4 mb-6">
              <h2 className="flex items-center gap-2 typo-section-heading text-[var(--color-text-primary)]">
                <User className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                <span>Personal &amp; Contact Identity</span>
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Primary contact details for curation communications and commercial documents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <Input
                  id="client-fullname"
                  label="Display / Contact Name"
                  value={fullName}
                  onChange={(e) => handleFieldChange(setFullName, e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  required
                  helperText="Used as your primary contact name across project briefs and proposals."
                />
              </div>

              <div>
                <Input
                  id="client-email"
                  label="Account Sign-in Email"
                  value={currentUser?.email || ''}
                  disabled
                  helperText="Managed via your authenticated account (read-only)."
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>

              <div>
                <Input
                  id="client-phone"
                  label="Direct Phone / Contact Number"
                  value={phone}
                  onChange={(e) => handleFieldChange(setPhone, e.target.value)}
                  placeholder="e.g. +44 20 7946 0912"
                  className="tabular-nums"
                  helperText="Optional direct line for project kickoff coordination."
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </div>
            </div>
          </Card>

          {/* Business & Organization Card */}
          <Card className="p-6 sm:p-8">
            <div className="border-b border-[var(--color-border)] pb-4 mb-6">
              <h2 className="flex items-center gap-2 typo-section-heading text-[var(--color-text-primary)]">
                <Building className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                <span>Organization &amp; Commercial Details</span>
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Organization identity referenced on new briefs, proposals, and service agreements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Input
                  id="client-company-name"
                  label="Company or Business Name"
                  value={companyName}
                  onChange={(e) => handleFieldChange(setCompanyName, e.target.value)}
                  placeholder="e.g. Acme Innovations Ltd"
                  helperText="Leave empty if commissioning as an independent client."
                  leftIcon={<Building className="w-4 h-4" />}
                />
              </div>

              <div>
                <Input
                  id="client-company-website"
                  label="Company Website"
                  value={companyWebsite}
                  onChange={(e) => handleFieldChange(setCompanyWebsite, e.target.value)}
                  placeholder="e.g. https://acme.example.com"
                  helperText="Helps matched specialists understand your business context."
                  leftIcon={<Globe className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  id="client-country"
                  label="Primary Country / Region"
                  value={country}
                  onChange={(e) => handleFieldChange(setCountry, e.target.value)}
                  options={COMMON_COUNTRIES}
                  helperText="Determines regional matching affinity and commercial jurisdiction."
                />
              </div>

              <div>
                <Select
                  id="client-timezone"
                  label="Primary Working Timezone"
                  value={timezone}
                  onChange={(e) => handleFieldChange(setTimezone, e.target.value)}
                  options={COMMON_TIMEZONES}
                  helperText="Used to prioritize specialists with overlapping working hours."
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  id="client-billing-email"
                  label="Dedicated Billing Email"
                  value={billingEmail}
                  onChange={(e) => handleFieldChange(setBillingEmail, e.target.value)}
                  placeholder="e.g. finance@acme.example.com"
                  helperText="Commercial notices and agreement records use this contact address."
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>
            </div>
          </Card>

          {/* Historical Record Integrity Callout */}
          <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-start gap-3.5 text-[var(--color-text-secondary)]">
            <div className="w-8 h-8 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0 text-[var(--color-text-primary)]">
              <FileText className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="text-[13px] leading-relaxed">
              <span className="font-semibold text-[var(--color-text-primary)] block mb-0.5">
                Historical Snapshot Integrity
              </span>
              Profile updates apply to new project briefs, future proposals, and new agreements.
              Previously submitted brief snapshots, accepted proposals, and signed contracts remain preserved as immutable historical records.
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--color-warning-text)] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--color-warning)]" aria-hidden="true" />
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  All changes saved
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                id="client-profile-cancel"
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                id="client-profile-save"
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
