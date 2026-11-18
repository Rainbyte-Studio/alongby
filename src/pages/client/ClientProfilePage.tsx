import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DiscardChangesModal } from '../../components/common/DiscardChangesModal';
import {
  Building,
  Globe,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
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

  const [fullName, setFullName] = useState(clientProfile?.fullName || userProfile?.displayName || '');
  const [companyName, setCompanyName] = useState(clientProfile?.companyName || '');
  const [companyWebsite, setCompanyWebsite] = useState(clientProfile?.companyWebsite || '');
  const [country, setCountry] = useState(clientProfile?.country || 'United Kingdom');
  const [timezone, setTimezone] = useState(clientProfile?.timezone || 'UTC');
  const [phone, setPhone] = useState(clientProfile?.phone || '');
  const [billingEmail, setBillingEmail] = useState(clientProfile?.billingEmail || currentUser?.email || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Authoritative reset to persisted profile values
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

  // Synchronize when clientProfile finishes loading if not touched yet
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
    // No unsaved changes: navigate immediately
    navigate('/client');
  };

  const handleConfirmDiscard = () => {
    // 1. Discard all unsaved local form changes and restore last persisted profile values
    resetToPersisted();
    // 2. Clear modal state
    setShowDiscardModal(false);
    // 3. Navigate back to client dashboard
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

      // Synchronize in-memory auth state so ClientDashboard updates immediately
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
      title="Client Profile"
      subtitle="Manage your account and business information used across your Alongby projects."
      showBack={true}
      onBack={handleCancel}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Success Alert */}
        {successMessage && (
          <div
            id="client-profile-success"
            className="p-4 rounded-[var(--radius-card)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] flex flex-col sm:flex-row sm:items-center gap-3 text-[var(--color-success-text)]"
          >
            <div className="w-8 h-8 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-success-border)] flex items-center justify-center shrink-0 text-[var(--color-success)]">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">{successMessage}</h3>
              <p className="text-xs mt-0.5 opacity-90">
                Your updated company and contact information is now active for upcoming projects and shortlists.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/client')}
              className="shrink-0 self-start sm:self-center"
            >
              Go to Dashboard
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            id="client-profile-error"
            className="p-4 rounded-[var(--radius-card)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] flex items-start gap-3 text-[var(--color-error-text)]"
          >
            <AlertCircle className="w-5 h-5 text-[var(--color-error)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Unable to save profile</h3>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identity & Contact Card */}
          <Card className="p-6 sm:p-8">
            <div className="border-b border-[var(--color-border)] pb-4 mb-6">
              <h2 className="flex items-center gap-2 typo-section-heading text-[var(--color-text-primary)]">
                <User className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
                <span>Personal &amp; Contact Identity</span>
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Your primary contact information for Alongby curation specialists and commercial communications.
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
                  helperText="Used as your primary name across project opportunities and communications."
                />
              </div>

              <div>
                <Input
                  id="client-email"
                  label="Account Sign-in Email"
                  value={currentUser?.email || ''}
                  disabled
                  helperText="Managed via your secure authentication account (read-only)."
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
                  helperText="Optional direct line for expedited project kickoff coordination."
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </div>
            </div>
          </Card>

          {/* Business & Organization Card */}
          <Card className="p-6 sm:p-8">
            <div className="border-b border-[var(--color-border)] pb-4 mb-6">
              <h2 className="flex items-center gap-2 typo-section-heading text-[var(--color-text-primary)]">
                <Building className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
                <span>Organization &amp; Commercial Details</span>
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Details representing your organization on project briefs, matches, and future commercial proposals.
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
                  helperText="Leave empty if commissioning as an independent private client."
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
                  helperText="Helps matched professionals understand your brand identity."
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
                  helperText="Used to suggest professionals with overlapping working hours."
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  id="client-billing-email"
                  label="Dedicated Billing Email"
                  value={billingEmail}
                  onChange={(e) => handleFieldChange(setBillingEmail, e.target.value)}
                  placeholder="e.g. finance@acme.example.com"
                  helperText="Invoices, deposit confirmations, and milestone receipts will be dispatched here."
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>
            </div>
          </Card>

          {/* Legal & Commercial Snapshot Integrity Callout */}
          <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-start gap-3.5 text-[var(--color-text-secondary)]">
            <div className="w-8 h-8 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0 text-[var(--color-text-primary)]">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--color-text-primary)] block mb-0.5">
                Commercial &amp; Historical Record Integrity
              </span>
              Profile updates immediately apply to future project briefs, matches, and new commercial proposals.
              Any previously submitted brief snapshots, accepted proposals, or executed contracts remain historically
              preserved as immutable legal records under Alongby governance.
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--color-warning-text)] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                  <ShieldCheck className="w-3.5 h-3.5" />
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
