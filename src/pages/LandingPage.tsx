import React from 'react';
import { Button } from '../components/ui/Button';
import { ArrowRight, ShieldCheck, Layers, Users } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'signin' | 'signup', role?: 'client' | 'professional') => void;
}

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Define your brief',
    description:
      'Share your project scope, timeline, and indicative budget through a structured, guided brief.',
  },
  {
    number: '02',
    title: 'Curated shortlist',
    description:
      'We evaluate vetted specialists against your requirements and present 2–3 qualified candidates with tailored quotes.',
  },
  {
    number: '03',
    title: 'Contract & protection',
    description:
      'Select your match, refine a clear commercial proposal, and sign an immutable contract with staged milestones.',
  },
  {
    number: '04',
    title: 'Phased delivery',
    description:
      'Collaborate inside a dedicated workspace. Review milestone deliverables with transparent approval triggers.',
  },
];

const PRINCIPLES = [
  {
    icon: Users,
    kicker: '01 · Vetted Capacity',
    title: 'Curated, Never Crowded',
    description:
      'No browsing hundreds of unvetted profiles. We verify professional credentials, past project delivery, and live capacity before matching.',
  },
  {
    icon: ShieldCheck,
    kicker: '02 · Milestone Protection',
    title: 'Staged Commercial Protection',
    description:
      'Two clear phases: Deposit and Final Delivery. Funds are structured transparently and aligned with explicit milestone approval.',
  },
  {
    icon: Layers,
    kicker: '03 · Craft Over Volume',
    title: 'Zero Price Degradation',
    description:
      'We eliminate underbidding races. Professionals submit realistic, structured commercial proposals reflecting high-calibre craftsmanship.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-app)]">
      {/* Editorial Hero Section */}
      <section className="relative bg-[var(--color-surface)] border-b border-[var(--color-border)] pt-16 pb-16 sm:pt-24 sm:pb-24 lg:pt-28 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-5">
              Curated Managed Marketplace
            </p>

            <h1 className="typo-hero text-[var(--color-text-primary)] mb-6">
              Your project. <br className="hidden sm:inline" />
              The right professional.
            </h1>

            <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed mb-10">
              Tell us what you need. Alongby assembles a curated selection of vetted professionals carefully matched to your requirements. You choose who feels right.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onOpenAuth('signup', 'client')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start a Project
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onOpenAuth('signup', 'professional')}
              >
                Join as a Professional
              </Button>
            </div>
          </div>

          {/* Quiet Editorial Proof Strip */}
          <div className="mt-14 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Private Matching
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                No public bidding wars or noisy directories
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Focused Comparison
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
                2–3 vetted recommendations with structured quotes
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Commercial Clarity
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                Staged milestone protection from proposal to contract
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-14 pb-6 border-b border-[var(--color-border)]">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-2.5">
              The Alongby Process
            </p>
            <h2 className="typo-page-title text-[var(--color-text-primary)]">
              How curated matching works
            </h2>
          </div>
          <p className="text-sm sm:text-[15px] text-[var(--color-text-secondary)] max-w-md leading-relaxed">
            We replaced the noise of open directories with a human, managed workflow designed for clarity and trust.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {PROCESS_STEPS.map((step) => (
            <div
              key={step.number}
              className="flex flex-col p-6 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <div className="font-serif text-2xl font-semibold text-[var(--color-text-primary)] tabular-nums pb-4 mb-4 border-b border-[var(--color-border)]">
                {step.number}
              </div>
              <h3 className="typo-card-title text-[var(--color-text-primary)] mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed tabular-nums">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Principles Section */}
      <section
        id="principles"
        className="py-16 sm:py-24 bg-[var(--color-surface-secondary)] border-t border-[var(--color-border)] px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 sm:mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-2.5">
              Product Principles
            </p>
            <h2 className="typo-page-title text-[var(--color-text-primary)]">
              A managed service, not a gig directory
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {PRINCIPLES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 sm:p-7 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] tracking-wide">
                        {item.kicker}
                      </span>
                      <div className="w-9 h-9 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="typo-card-title text-[var(--color-text-primary)] mb-2.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to action footer banner */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="typo-page-title text-[var(--color-text-primary)] mb-4">
            Ready to bring your digital vision to life?
          </h2>
          <p className="text-sm sm:text-[15px] text-[var(--color-text-secondary)] max-w-lg mx-auto mb-8 leading-relaxed tabular-nums">
            Begin with a straightforward brief. Receive a tailored shortlist of 2–3 vetted professionals ready to start.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => onOpenAuth('signup', 'client')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Start a Project with Alongby
          </Button>
        </div>
      </section>
    </div>
  );
};
