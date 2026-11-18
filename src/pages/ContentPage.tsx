import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

type PageKind = 'how' | 'clients' | 'professionals' | 'about';
interface ContentPageProps { kind: PageKind; }

const howSteps = [
  { title: 'Start with a project brief', text: 'Describe the outcome you want, the services you need, your preferred timeline and an indicative budget. The guided brief helps make the scope understandable to everyone reviewing it. You can save your progress before submitting.' },
  { title: 'Review and matching', text: 'A submitted brief goes through a suitability review. Alongby considers professional expertise, experience, budget alignment and declared availability before inviting relevant specialists to respond. An invitation is not a guarantee of an offer.' },
  { title: 'Compare a considered shortlist', text: 'Professionals who receive an invitation can review the requirements and choose to quote or decline. When enough suitable responses have been reviewed, a focused shortlist is shared with the client, usually featuring two or three professionals.' },
  { title: 'Choose and define the work', text: 'The client selects a preferred professional. The next step is a structured commercial proposal outlining deliverables, assumptions, exclusions, timeline, revision allowances and agreed fees. A project brief or indicative quote is not itself a final agreement.' },
  { title: 'Confirm the agreement', text: 'Both parties review and accept the resulting contract. Acceptance records help make decisions traceable and establish a shared reference for the engagement.' },
  { title: 'Follow the agreed milestones', text: 'Work can then move through the two-phase collaboration structure, with milestones and reviews connected to the documented scope. The agreed proposal and contract determine what each stage means for the specific project.' },
] as const;

const clientFeatures = [
  { title: 'Brief once, explain clearly', text: 'A guided flow helps capture objectives, deliverables, reference material, budget expectations and timing without relying on scattered messages.' },
  { title: 'A shortlist, not a public bidding feed', text: 'Rather than receiving unlimited unsolicited pitches, clients evaluate a curated group of professionals who have seen the project requirements and chosen to respond.' },
  { title: 'Compare offers with context', text: 'Look beyond price by reviewing relevant skills, experience, approach and estimated timing alongside each quote.' },
  { title: 'Agree before work begins', text: 'Selected projects progress to a proposal and contract that make scope boundaries, revisions, milestones and commercial terms explicit.' },
] as const;

const professionalFeatures = [
  { title: 'Show the work you do best', text: 'Present your services, experience, portfolio, working languages and minimum project budget in a professional profile.' },
  { title: 'Keep your availability current', text: 'Set your availability and capacity so invitations can take your schedule into account.' },
  { title: 'Review before you quote', text: 'Invitations include a structured brief and indicative budget. Assess the fit, decide whether to respond and submit a tailored fee, timeline and approach.' },
  { title: 'Move forward on clear terms', text: 'If selected, collaborate on a defined proposal and review the contract before formally accepting the engagement.' },
] as const;

const values = [
  { title: 'A smaller, better set of choices', text: 'Thoughtful matching matters more than a long directory. We want clients to spend their time evaluating fit, not filtering noise.' },
  { title: 'Respect for professional expertise', text: 'Independent specialists deserve enough context to decide whether a project is appropriate before investing in a quote.' },
  { title: 'Clarity before commitment', text: 'Budgets, quotes, proposals and signed terms serve different purposes. Each should be understandable at the moment it matters.' },
  { title: 'A connected project record', text: 'Important decisions and acceptance steps belong with the project, so both parties can see what was agreed.' },
] as const;

const pageData = {
  how: {
    eyebrow: 'How Alongby Works',
    title: 'From the first brief to a clear agreement.',
    intro: 'Alongby brings project definition, professional matching, commercial proposals and agreement steps into a single guided experience. Here is what happens at each stage and what you can expect.',
  },
  clients: {
    eyebrow: 'For Clients',
    title: 'The right professional, with a clearer path forward.',
    intro: 'Whether you are launching a website, shaping a brand or building a digital product, finding a specialist should not require weeks of sorting through pitches. Alongby gives your team a structured way to define the work, evaluate candidates and agree on next steps.',
  },
  professionals: {
    eyebrow: 'For Professionals',
    title: 'Relevant opportunities. Clear expectations.',
    intro: 'Alongby is for independent digital and creative professionals who want to evaluate serious project briefs on their merits. Build a considered profile, keep your availability up to date and respond when the work genuinely fits.',
  },
  about: {
    eyebrow: 'Our Approach',
    title: 'Better collaboration begins before the work.',
    intro: 'Good projects need more than a talented professional. They need shared context, realistic expectations and an agreed way forward. Alongby is designed to make those foundations easier to establish.',
  },
} as const;

const detailSections = {
  clients: [
    { title: 'Digital work, without the guesswork', text: 'Describe your goals and requirements through a structured brief. Alongby reviews the project before identifying specialists whose expertise and stated parameters may align.' },
    { title: 'Your choice, with the information you need', text: 'Compare a small shortlist with relevant credentials, approach notes and project-specific quotes. You choose whom to work with; the platform does not automatically assign a professional.' },
    { title: 'From quote to working agreement', text: 'Once you make a selection, the proposal sets out what will be delivered, when, under which assumptions and on what commercial terms. Both parties then review the contract before the engagement moves ahead.' },
  ],
  professionals: [
    { title: 'Be discovered for the right reasons', text: 'Your profile communicates your primary disciplines, skills and relevant experience. Matching considers the requirements of the project alongside the information you have provided.' },
    { title: 'Decide where to invest your time', text: 'An invitation lets you inspect the brief and budget context privately. You can submit a tailored quote or decline when availability, budget or scope does not fit.' },
    { title: 'Work from agreed scope', text: 'If a client selects you, a structured proposal helps establish deliverables, timeline, revision terms and milestones. Contract acceptance records the agreement before project collaboration continues.' },
  ],
} as const;

const SectionGrid: React.FC<{ items: readonly { title: string; text: string }[] }> = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-9">
    {items.map((item, index) => (
      <article key={item.title} className="border-t border-[var(--color-border-strong)] pt-5 min-w-0">
        <span className="font-serif text-base text-[var(--color-text-muted)] tabular-nums">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="mt-4 mb-2 typo-card-title text-[var(--color-text-primary)]">{item.title}</h3>
        <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-secondary)] max-w-xl">{item.text}</p>
      </article>
    ))}
  </div>
);

export const ContentPage: React.FC<ContentPageProps> = ({ kind }) => {
  const location = useLocation();
  const page = pageData[kind];
  const editorialImage = kind === "clients" ? "editorial-clients.svg" : kind === "professionals" ? "editorial-professionals.svg" : "editorial-hero.svg";

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    const id = location.hash.slice(1);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  return (
    <div className="min-w-0 bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      <section className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 sm:px-6 lg:px-8 pt-16 pb-16 sm:pt-24 sm:pb-24">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-10 underline underline-offset-4">Back to Alongby</Link>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-4">{page.eyebrow}</p>
              <h1 className="typo-hero max-w-4xl mb-6">{page.title}</h1>
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">{page.intro}</p>
            </div>
            <div className="lg:col-span-5 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] aspect-[5/3] lg:aspect-[4/3] bg-[#d6d2ca]">
              <img src={`/images/${editorialImage}`} alt="Minimal monochrome editorial artwork reflecting thoughtful creative collaboration" width="1000" height="780" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {kind === 'how' && (
        <>
          <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="max-w-7xl mx-auto">
              <h2 className="typo-section-heading mb-10">Your project, step by step</h2>
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {howSteps.map((step, index) => (
                  <li key={step.title} id={index === 4 ? 'agreements' : undefined} className="scroll-mt-24 border-t border-[var(--color-border-strong)] pt-5">
                    <span className="font-serif text-base text-[var(--color-text-muted)]">{String(index + 1).padStart(2, '0')}</span>
                    <h3 className="typo-card-title mt-4 mb-2">{step.title}</h3>
                    <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-secondary)] max-w-xl">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
          <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
            <div className="max-w-7xl mx-auto">
              <h2 className="typo-section-heading mb-5">A note on budgets and payments</h2>
              <p className="text-sm sm:text-base max-w-3xl leading-relaxed text-[var(--color-text-secondary)]">
                The budget you enter in the initial brief is indicative. A quote helps you compare potential approaches; the final deliverables, fees and two-phase milestone terms are specified in the accepted proposal and contract. Alongby provides project, proposal and agreement workflows. It does not hold client funds or operate as a licensed escrow service.
              </p>
            </div>
          </section>
        </>
      )}

      {kind === 'clients' && (
        <>
          <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24"><div className="max-w-7xl mx-auto">
            <h2 className="typo-section-heading mb-10">What you gain</h2><SectionGrid items={clientFeatures} />
          </div></section>
          <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-[var(--color-surface)] border-y border-[var(--color-border)]"><div className="max-w-7xl mx-auto">
            <h2 className="typo-section-heading mb-10">A more considered way to commission</h2><SectionGrid items={detailSections.clients} />
          </div></section>
        </>
      )}

      {kind === 'professionals' && (
        <>
          <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24"><div className="max-w-7xl mx-auto">
            <h2 className="typo-section-heading mb-10">Built around your practice</h2><SectionGrid items={professionalFeatures} />
          </div></section>
          <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-[var(--color-surface)] border-y border-[var(--color-border)]"><div className="max-w-7xl mx-auto">
            <h2 className="typo-section-heading mb-10">From invitation to agreement</h2><SectionGrid items={detailSections.professionals} />
          </div></section>
        </>
      )}

      {kind === 'about' && (
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24"><div className="max-w-7xl mx-auto">
          <h2 className="typo-section-heading mb-10">What guides Alongby</h2><SectionGrid items={values} />
          <div className="mt-16 border-t border-[var(--color-border)] pt-9 max-w-3xl">
            <h2 className="typo-section-heading mb-4">A practical idea of trust</h2>
            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-secondary)]">Trust grows when the process is visible. Alongby connects the initial brief with professional responses, a defined proposal, documented acceptance and the subsequent project record. It is designed to reduce uncertainty, not promise that every project will be a perfect match.</p>
          </div>
        </div></section>
      )}

      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-[var(--color-surface-secondary)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h2 className="typo-section-heading mb-3">Ready to take the next step?</h2>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-xl leading-relaxed">Explore the process, then start your brief or introduce your professional practice when you are ready.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link to="/how-it-works" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">See how it works <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Get started <ArrowUpRight className="w-4 h-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
};
