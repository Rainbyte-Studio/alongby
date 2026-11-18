import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (
    mode?: 'signin' | 'signup',
    role?: 'client' | 'professional'
  ) => void;
}

const ENGAGEMENT_PHASES = [
  {
    index: '01',
    phase: 'Guided Project Brief',
    detail: 'Structured scope, deliverables, timeline preferences, and indicative EUR range.',
  },
  {
    index: '02',
    phase: 'Curated Shortlist',
    detail: 'Private matching and review presenting 2–3 relevant specialists with tailored quotes.',
  },
  {
    index: '03',
    phase: 'Commercial Proposal',
    detail: 'Itemized deliverables, milestones, revision terms, and bilateral contract acceptance.',
  },
  {
    index: '04',
    phase: 'Staged Collaboration',
    detail: 'Structured Phase 1 and Phase 2 milestone reviews tracked inside one workspace.',
  },
] as const;

const VALUE_PILLARS = [
  {
    number: '01',
    title: 'Structured project briefs',
    description:
      'A guided nine-step brief captures service category, deliverables, existing assets, timeline flexibility, and an indicative EUR budget before matching begins.',
  },
  {
    number: '02',
    title: 'Curated professional matching',
    description:
      'Every submitted brief is evaluated against verified disciplines, relevant delivery experience, minimum project thresholds, and live practitioner capacity.',
  },
  {
    number: '03',
    title: 'Reviewed commercial opportunities',
    description:
      'Invited specialists inspect complete project requirements privately and decide whether to submit a tailored commercial quote or decline cleanly.',
  },
  {
    number: '04',
    title: 'Transparent professional comparisons',
    description:
      'Clients receive a focused shortlist—typically two to three vetted candidates—comparing credentials, match rationale, timelines, and commercial offers side by side.',
  },
  {
    number: '05',
    title: 'Defined project proposals',
    description:
      'Once a specialist is selected, scope boundaries, itemized deliverables, assumptions, and milestone schedules are formalized in a structured written proposal.',
  },
  {
    number: '06',
    title: 'Clear acceptance & collaboration stages',
    description:
      'Documented proposal approval and bilateral contract acceptance establish an auditable foundation for Phase 1 and Phase 2 project delivery.',
  },
] as const;

const CLIENT_JOURNEY = [
  {
    step: '01',
    title: 'Create a structured project brief',
    description:
      'Outline your objectives, required deliverables, existing assets, target schedule, and an indicative budget range—saving progress as a draft at any point.',
  },
  {
    step: '02',
    title: 'Suitability & curation review',
    description:
      'Alongby reviews your submitted brief and identifies vetted professionals whose specialization, budget fit, and current capacity match your requirements.',
  },
  {
    step: '03',
    title: 'Receive a curated professional shortlist',
    description:
      'Once invited practitioners respond and curation review is complete, a focused shortlist is published directly to your project workspace.',
  },
  {
    step: '04',
    title: 'Compare specialists and commercial offers',
    description:
      'Evaluate 2–3 matched professionals side by side across relevant experience, approach notes, estimated timelines, and project-specific quotes.',
  },
  {
    step: '05',
    title: 'Select your preferred professional',
    description:
      'Confirm the practitioner best aligned with your project to move from initial comparison into formal commercial scoping.',
  },
  {
    step: '06',
    title: 'Review and finalize the commercial proposal',
    description:
      'Examine structured deliverables, timeline durations, revision allowances, and two-stage commercial terms—requesting adjustments if needed before approval.',
  },
  {
    step: '07',
    title: 'Complete agreement and acceptance steps',
    description:
      'Review the generated service contract and record formal client and professional acceptance with timestamped verification.',
  },
  {
    step: '08',
    title: 'Proceed through project collaboration stages',
    description:
      'Advance into applicable commencement, Phase 1 review, and Phase 2 completion stages as supported within your project lifecycle.',
  },
] as const;

const PROFESSIONAL_JOURNEY = [
  {
    step: '01',
    title: 'Complete your professional profile',
    description:
      'Present your primary disciplines, core skills, selected portfolio work, working languages, and minimum engagement budget.',
  },
  {
    step: '02',
    title: 'Set relevant expertise and availability',
    description:
      'Keep your availability status, earliest start date, and concurrent project capacity up to date so invitations respect your schedule.',
  },
  {
    step: '03',
    title: 'Receive curated opportunities',
    description:
      'Receive private notifications when a reviewed client brief corresponds to your declared services, experience, and budget parameters.',
  },
  {
    step: '04',
    title: 'Review structured project requirements',
    description:
      'Assess clear scope definitions, desired features, timeline flexibility, and indicative client budget context before investing time in a response.',
  },
  {
    step: '05',
    title: 'Submit a commercial quote or decline',
    description:
      'Provide a realistic fee, estimated duration, and project approach—or decline directly when scope or timing is not the right fit.',
  },
  {
    step: '06',
    title: 'Participate in proposal and agreement',
    description:
      'When selected by the client, prepare the detailed commercial proposal and complete bilateral contract acceptance to formalize the engagement.',
  },
] as const;

const CLIENT_SPECIFICATIONS = [
  {
    term: 'Guided Scope Definition',
    detail:
      'Domain-specific brief prompts for websites, e-commerce, web and mobile applications, UI/UX design, brand identity, and digital growth.',
  },
  {
    term: 'Focused Decision-Making',
    detail:
      'Replace dozens of cold inbound pitches with a quiet comparison of two to three qualified practitioners who have already reviewed your brief.',
  },
  {
    term: 'Transparent Commercial Terms',
    detail:
      'Inspect quote breakdowns, estimated durations, deliverables, exclusions, and revision boundaries before making a binding commitment.',
  },
  {
    term: 'Defined Agreements & Next Steps',
    detail:
      'Every transition—from shortlist selection to accepted proposal and signed agreement—is documented clearly inside your project record.',
  },
] as const;

const PROFESSIONAL_BENEFITS = [
  {
    title: 'Curated opportunities',
    detail:
      'Invitations are filtered by service category, skill relevance, minimum budget threshold, and declared availability.',
  },
  {
    title: 'Structured client briefs',
    detail:
      'Evaluate concrete deliverables, goals, existing assets, and timeline expectations rather than vague one-line inquiries.',
  },
  {
    title: 'Clear commercial expectations',
    detail:
      'Indicative client budgets are shared upfront, allowing realistic scoping without public race-to-the-bottom bidding.',
  },
  {
    title: 'Considered profile presentation',
    detail:
      'Highlight verified disciplines, years of practice, portfolio work, and working languages in a calm editorial format.',
  },
  {
    title: 'Transparent quote submission',
    detail:
      'Submit structured commercial offers privately—or pass cleanly when your studio calendar is committed.',
  },
  {
    title: 'Structured collaboration',
    detail:
      'Move from client selection directly into a defined proposal and bilateral contract workflow with explicit scope boundaries.',
  },
] as const;

const GOVERNANCE_STANDARDS = [
  {
    index: '01',
    heading: 'Private curation rather than public listings',
    body: 'Client briefs are never posted to an open job board, and professionals do not compete in public bidding threads. Matching and shortlist publication are reviewed before client presentation.',
  },
  {
    index: '02',
    heading: 'Explicit scope before contractual commitment',
    body: 'Indicative brief budgets guide initial suitability matching only. Binding deliverables, timeline milestones, assumptions, and fees are defined explicitly in the commercial proposal.',
  },
  {
    index: '03',
    heading: 'Two-phase milestone structure',
    body: 'Proposals and contracts organize commercial terms into two clear stages—Phase 1 commencement and Phase 2 final delivery—aligning project progress with documented review points.',
  },
  {
    index: '04',
    heading: 'Verifiable acceptance & activity records',
    body: 'Proposal approvals, generated contract snapshots, e-signature acceptance records, and project status transitions are logged chronologically for both client and professional.',
  },
] as const;

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeJourney, setActiveJourney] = useState<'client' | 'professional'>(
    'client'
  );

  const handleClientEntry = () => {
    if (currentUser && userProfile) {
      if (userProfile.onboardingStatus === 'pending') {
        navigate(
          userProfile.role === 'client'
            ? '/onboarding/client'
            : '/onboarding/professional'
        );
        return;
      }
      if (userProfile.role === 'client') {
        navigate('/client/projects/new');
        return;
      }
      if (userProfile.role === 'admin') {
        navigate('/admin');
        return;
      }
      navigate('/professional');
      return;
    }
    onOpenAuth('signup', 'client');
  };

  const handleProfessionalEntry = () => {
    if (currentUser && userProfile) {
      if (userProfile.onboardingStatus === 'pending') {
        navigate(
          userProfile.role === 'professional'
            ? '/onboarding/professional'
            : '/onboarding/client'
        );
        return;
      }
      if (userProfile.role === 'professional') {
        navigate('/professional');
        return;
      }
      if (userProfile.role === 'admin') {
        navigate('/admin');
        return;
      }
      navigate('/client');
      return;
    }
    onOpenAuth('signup', 'professional');
  };

  const clientCtaLabel =
    currentUser && userProfile?.role === 'client'
      ? userProfile.onboardingStatus === 'pending'
        ? 'Complete Client Onboarding'
        : 'Create a Project Brief'
      : 'Start a Project';

  const professionalCtaLabel =
    currentUser && userProfile?.role === 'professional'
      ? userProfile.onboardingStatus === 'pending'
        ? 'Complete Professional Profile'
        : 'Open Professional Workspace'
      : 'Join as a Professional';

  return (
    <div className="flex flex-col bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      {/* =====================================================================
          1. EDITORIAL HERO SECTION
          ===================================================================== */}
      <section className="bg-[var(--color-surface)] border-b border-[var(--color-border)] pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Primary Editorial Column */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 text-xs font-medium text-[var(--color-text-secondary)] mb-5">
                <span>Curated Managed Marketplace</span>
                <span aria-hidden="true" className="text-[var(--color-border-strong)]">
                  ·
                </span>
                <span>Digital &amp; Creative Practice</span>
              </div>

              <h1 className="typo-hero text-[var(--color-text-primary)] max-w-2xl mb-6">
                Structured briefs. Curated specialists. Considered digital work.
              </h1>

              <p className="font-sans text-base sm:text-[17px] text-[var(--color-text-secondary)] max-w-xl leading-relaxed mb-8 sm:mb-10">
                Alongby connects commissioning teams with selectively matched independent professionals—guiding each engagement from a structured project brief through comparative quotes, defined proposals, and formal agreement.
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleClientEntry}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {clientCtaLabel}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleProfessionalEntry}
                >
                  {professionalCtaLabel}
                </Button>
              </div>

              {!currentUser && (
                <p className="mt-4 text-xs text-[var(--color-text-muted)]">
                  Already have an Alongby account?{' '}
                  <button
                    type="button"
                    onClick={() => onOpenAuth('signin')}
                    className="font-medium text-[var(--color-text-primary)] underline underline-offset-4 hover:opacity-80 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Sign in to your workspace
                  </button>
                </p>
              )}
            </div>

            {/* Restrained Architectural Focal Specimen */}
            <div className="lg:col-span-5">
              <div className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 sm:p-7">
                <div className="flex items-baseline justify-between gap-4 pb-4 mb-2 border-b border-[var(--color-border-strong)]">
                  <h2 className="font-sans text-xs font-semibold text-[var(--color-text-primary)] tracking-wide">
                    Engagement Architecture
                  </h2>
                  <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                    01 — 04
                  </span>
                </div>

                <ol className="divide-y divide-[var(--color-border)]">
                  {ENGAGEMENT_PHASES.map((item) => (
                    <li
                      key={item.index}
                      className="py-3.5 first:pt-2 last:pb-2 flex items-start gap-4"
                    >
                      <span className="font-serif text-base font-semibold text-[var(--color-text-primary)] tabular-nums shrink-0 pt-0.5">
                        {item.index}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-sans text-[14px] font-semibold text-[var(--color-text-primary)] leading-snug">
                          {item.phase}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed tabular-nums">
                          {item.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-4 pt-3.5 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Not an open directory: briefs remain private and shortlists are assembled specifically for each project.
                </div>
              </div>
            </div>
          </div>

          {/* Quiet Unboxed Discipline Strip */}
          <div className="mt-12 sm:mt-16 pt-6 border-t border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)] shrink-0">
              Supported Disciplines
            </span>
            <p className="leading-relaxed text-[var(--color-text-secondary)]">
              Websites <span aria-hidden="true" className="mx-1.5 text-[var(--color-border-strong)]">·</span>
              E-commerce <span aria-hidden="true" className="mx-1.5 text-[var(--color-border-strong)]">·</span>
              Web Applications <span aria-hidden="true" className="mx-1.5 text-[var(--color-border-strong)]">·</span>
              Mobile Applications <span aria-hidden="true" className="mx-1.5 text-[var(--color-border-strong)]">·</span>
              UI/UX Design <span aria-hidden="true" className="mx-1.5 text-[var(--color-border-strong)]">·</span>
              Branding <span aria-hidden="true" className="mx-1.5 text-[var(--color-border-strong)]">·</span>
              Digital Marketing &amp; SEO
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. VALUE PROPOSITION — OUR PHILOSOPHY (#principles)
          ===================================================================== */}
      <section
        id="principles"
        className="py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[var(--color-bg-app)]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Editorial Essay Lead */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] tabular-nums mb-2.5">
                01 · Our Philosophy
              </p>
              <h2 className="typo-page-title text-[var(--color-text-primary)] mb-4">
                Deliberate structure in place of marketplace noise.
              </h2>
              <p className="text-sm sm:text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                Open freelance directories shift the burden of filtering onto clients while pushing specialists into rapid underbidding. Alongby replaces volume with a considered commercial workflow from initial scope to signed agreement.
              </p>
            </div>

            {/* 6-Part Hairline Editorial Ledger (non-card layout variation) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 lg:gap-x-10 gap-y-8 sm:gap-y-10">
              {VALUE_PILLARS.map((pillar) => (
                <div
                  key={pillar.number}
                  className="pt-5 border-t border-[var(--color-border-strong)]"
                >
                  <span className="block font-serif text-sm font-semibold text-[var(--color-text-muted)] tabular-nums mb-2">
                    {pillar.number}.
                  </span>
                  <h3 className="typo-card-title text-[var(--color-text-primary)] mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. HOW ALONGBY WORKS (#how-it-works)
          ===================================================================== */}
      <section
        id="how-it-works"
        className="py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[var(--color-surface)] border-y border-[var(--color-border)]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 mb-10 sm:mb-14 border-b border-[var(--color-border)]">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] tabular-nums mb-2.5">
                02 · How Alongby Works
              </p>
              <h2 className="typo-page-title text-[var(--color-text-primary)]">
                Two coordinated workflows, one shared standard of clarity.
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[var(--color-text-secondary)] max-w-md leading-relaxed">
              Every stage corresponds directly to how briefs, shortlists, quotes, proposals, and agreements operate inside the platform.
            </p>
          </div>

          {/* Mobile & Tablet Perspective Switcher (<1024px) */}
          <div
            role="tablist"
            aria-label="Workflow perspective"
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                setActiveJourney((prev) =>
                  prev === 'client' ? 'professional' : 'client'
                );
              }
            }}
            className="lg:hidden flex rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] p-1 mb-8"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeJourney === 'client'}
              tabIndex={activeJourney === 'client' ? 0 : -1}
              onClick={() => setActiveJourney('client')}
              className={`flex-1 py-2.5 px-2.5 text-xs sm:text-[13px] rounded-[6px] transition-colors cursor-pointer tabular-nums whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                activeJourney === 'client'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-[var(--shadow-card)]'
                  : 'text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text-primary)]'
              }`}
            >
              Clients (01–08)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeJourney === 'professional'}
              tabIndex={activeJourney === 'professional' ? 0 : -1}
              onClick={() => setActiveJourney('professional')}
              className={`flex-1 py-2.5 px-2.5 text-xs sm:text-[13px] rounded-[6px] transition-colors cursor-pointer tabular-nums whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                activeJourney === 'professional'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-[var(--shadow-card)]'
                  : 'text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text-primary)]'
              }`}
            >
              Professionals (01–06)
            </button>
          </div>

          {/* Dual-Column Editorial Timeline on Desktop / Switched on Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Client Journey (Steps 01–08) */}
            <div
              className={`lg:col-span-7 ${
                activeJourney === 'client' ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-baseline justify-between gap-4 pb-3.5 mb-2 border-b border-[var(--color-text-primary)]">
                <h3 className="typo-section-heading text-[var(--color-text-primary)]">
                  Client Journey
                </h3>
                <span className="text-xs font-medium text-[var(--color-text-muted)] tabular-nums">
                  8 Stages · Brief to Delivery
                </span>
              </div>

              <ol className="divide-y divide-[var(--color-border)]">
                {CLIENT_JOURNEY.map((item) => (
                  <li
                    key={item.step}
                    className="py-4 sm:py-5 flex items-start gap-4 sm:gap-5"
                  >
                    <span className="font-serif text-lg font-semibold text-[var(--color-text-primary)] tabular-nums w-7 shrink-0">
                      {item.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-sans text-[15px] font-semibold text-[var(--color-text-primary)] leading-snug">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed tabular-nums">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Professional Journey (Steps 01–06) */}
            <div
              className={`lg:col-span-5 bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 sm:p-7 ${
                activeJourney === 'professional' ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-baseline justify-between gap-4 pb-3.5 mb-2 border-b border-[var(--color-border-strong)]">
                <h3 className="typo-section-heading text-[var(--color-text-primary)]">
                  Professional Journey
                </h3>
                <span className="text-xs font-medium text-[var(--color-text-muted)] tabular-nums">
                  6 Stages
                </span>
              </div>

              <ol className="divide-y divide-[var(--color-border)]">
                {PROFESSIONAL_JOURNEY.map((item) => (
                  <li
                    key={item.step}
                    className="py-4 flex items-start gap-4"
                  >
                    <span className="font-serif text-base font-semibold text-[var(--color-text-secondary)] tabular-nums w-6 shrink-0 pt-0.5">
                      {item.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-sans text-[14px] font-semibold text-[var(--color-text-primary)] leading-snug">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. CLIENT EXPERIENCE SECTION (#for-clients)
          ===================================================================== */}
      <section
        id="for-clients"
        className="py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[var(--color-bg-app)]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] tabular-nums">
                03 · For Clients
              </p>
              <h2 className="typo-page-title text-[var(--color-text-primary)]">
                Commission digital work with clarity before commitment.
              </h2>
              <p className="text-sm sm:text-[15px] text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
                Selecting an external specialist or studio often breaks down around ambiguous briefs, incomparable quotes, and informal agreements. Alongby structures each decision point so your team can evaluate fit, timeline, and commercial scope calmly.
              </p>
              <p className="text-sm sm:text-[15px] text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
                You remain in control of who you select and what commercial terms you approve—with far less coordination friction along the way.
              </p>

              <div className="pt-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleClientEntry}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {clientCtaLabel}
                </Button>
              </div>
            </div>

            {/* Structured Client Specification Sheet */}
            <div className="lg:col-span-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 sm:p-8">
              <h3 className="font-sans text-xs font-semibold text-[var(--color-text-muted)] tracking-wide pb-4 mb-2 border-b border-[var(--color-border)]">
                What Commissioning Teams Gain
              </h3>
              <dl className="divide-y divide-[var(--color-border)]">
                {CLIENT_SPECIFICATIONS.map((spec) => (
                  <div key={spec.term} className="py-4 first:pt-2 last:pb-1">
                    <dt className="font-sans text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {spec.term}
                    </dt>
                    <dd className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {spec.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. PROFESSIONAL EXPERIENCE SECTION (#for-professionals)
          ===================================================================== */}
      <section
        id="for-professionals"
        className="py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[var(--color-surface-secondary)] border-y border-[var(--color-border)]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Distinct Editorial Matrix on Left/Main */}
            <div className="lg:col-span-7 order-2 lg:order-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 border-[var(--color-border)]">
                {PROFESSIONAL_BENEFITS.map((benefit, index) => {
                  const hasRightBorder = index % 2 === 0;
                  const hasBottomBorder = index < 4;
                  return (
                    <div
                      key={benefit.title}
                      className={`p-5 sm:p-6 border-[var(--color-border)] ${
                        hasRightBorder ? 'sm:border-r' : ''
                      } ${hasBottomBorder ? 'sm:border-b' : ''}`}
                    >
                      <h3 className="font-sans text-[15px] font-semibold text-[var(--color-text-primary)] mb-1.5">
                        {benefit.title}
                      </h3>
                      <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                        {benefit.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editorial Narrative on Right */}
            <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] tabular-nums">
                04 · For Professionals
              </p>
              <h2 className="typo-page-title text-[var(--color-text-primary)]">
                Curated project briefs, free from public bidding races.
              </h2>
              <p className="text-sm sm:text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                Alongby is built for independent designers, engineers, marketers, and specialist studios who value well-defined client requirements and respectful commercial engagements.
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Opportunities are matched selectively based on project suitability, verified profile details, and declared availability—never through open feed scraping or speculative pitch contests.
              </p>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleProfessionalEntry}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="bg-[var(--color-surface)]"
                >
                  {professionalCtaLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. TRUST & COMMERCIAL TRANSPARENCY (#transparency)
          ===================================================================== */}
      <section
        id="transparency"
        className="py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[var(--color-surface)]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] tabular-nums mb-2.5">
              05 · Trust &amp; Transparency
            </p>
            <h2 className="typo-page-title text-[var(--color-text-primary)] mb-4">
              Accountability grounded in explicit process.
            </h2>
            <p className="text-sm sm:text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
              Trust in creative and technical engagements comes from unambiguous scope, documented commercial terms, and clear agreement records for everyone involved.
            </p>
          </div>

          {/* Horizontal Governance Rows */}
          <div className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            {GOVERNANCE_STANDARDS.map((item) => (
              <div
                key={item.index}
                className="py-6 sm:py-7 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 items-baseline"
              >
                <div className="md:col-span-5 flex items-baseline gap-3.5">
                  <span className="font-serif text-sm font-semibold text-[var(--color-text-muted)] tabular-nums shrink-0">
                    {item.index}
                  </span>
                  <h3 className="typo-card-title text-[var(--color-text-primary)]">
                    {item.heading}
                  </h3>
                </div>
                <p className="md:col-span-7 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Accurate Commercial & Platform Scope Disclosure */}
          <div className="mt-8 p-5 sm:p-6 rounded-[var(--radius-card)] bg-[var(--color-bg-app)] border border-[var(--color-border)] flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <span className="font-sans text-xs font-semibold text-[var(--color-text-primary)] shrink-0">
              Commercial &amp; Workflow Scope
            </span>
            <p className="text-xs sm:text-[13px] text-[var(--color-text-secondary)] leading-relaxed max-w-4xl">
              Indicative budget selections submitted during project intake are non-binding and help align initial curation. Final fees, deliverables, and two-stage milestone terms are agreed directly between client and professional in the accepted proposal and contract. Alongby provides structured workflow, proposal, and agreement management and does not hold client funds or act as a licensed escrow service.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. EDITORIAL CLOSING INVITATION
          ===================================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--color-bg-app)] border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-7 sm:p-12 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="typo-page-title text-[var(--color-text-primary)] mb-3">
                Begin with a structured brief, or introduce your practice.
              </h2>
              <p className="text-sm sm:text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                Outline your upcoming digital project to receive a curated shortlist of matched professionals, or register your specialist profile for future opportunities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Button
                variant="primary"
                size="lg"
                onClick={handleClientEntry}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {clientCtaLabel}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleProfessionalEntry}
              >
                {professionalCtaLabel}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
