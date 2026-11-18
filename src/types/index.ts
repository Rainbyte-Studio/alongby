export type UserRole = 'client' | 'professional' | 'admin';

export type AccountStatus = 'active' | 'pending' | 'suspended' | 'disabled';

export type OnboardingStatus = 'pending' | 'completed';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
}

export type VerificationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'verified' 
  | 'rejected' 
  | 'suspended';

export interface ClientProfile {
  userId: string;
  fullName: string;
  companyName?: string;
  companyWebsite?: string;
  country: string;
  timezone: string;
  phone?: string;
  billingEmail?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientProfileInput = Omit<
  ClientProfile,
  'userId' | 'createdAt' | 'updatedAt'
>;

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  serviceId?: string;
  projectType?: string;
  skills?: string[];
  industry?: string;
  liveUrl?: string;
  imageUrl?: string;
  year?: string;
}

export interface ProfessionalProfile {
  userId: string;
  displayName: string;
  professionalTitle: string;
  shortBio: string;
  country: string;
  timezone: string;
  languages: string[];
  primaryServices: string[];
  skills: string[];
  yearsOfExperience: number;
  minimumBudgetMinor: number;
  currency: string;
  website?: string;
  verificationStatus: VerificationStatus; // System-managed: admin controlled workflow
  completedProjectCount: number;          // System-managed: incremented on verified completions
  averageRating?: number;                 // System-managed: derived from client reviews only; omitted if unrated
  industries?: string[];
  preferredProjectTypes?: string[];
  portfolioItems?: PortfolioItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * User-editable onboarding and profile fields for professionals.
 * Explicitly separates user input from system-managed fields:
 * - averageRating (system-derived from verified client reviews)
 * - verificationStatus (governed by admin verification workflows)
 * - completedProjectCount (system-maintained marketplace metric)
 * - userId, createdAt, updatedAt (system identity and timestamps)
 */
export type ProfessionalProfileInput = Omit<
  ProfessionalProfile,
  | 'userId'
  | 'createdAt'
  | 'updatedAt'
  | 'verificationStatus'
  | 'completedProjectCount'
  | 'averageRating'
>;

export type AvailabilityStatus = 
  | 'available' 
  | 'limited' 
  | 'fully_booked' 
  | 'unavailable';

export interface ProfessionalAvailability {
  userId: string;
  availabilityStatus: AvailabilityStatus;
  nextAvailableDate: string;
  maximumConcurrentProjects: number;
  currentActiveProjectCount: number;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: UserRole;
  eventType: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Architectural definitions for Project and Commercial Lifecycle (Phase 2+)
 */
export type ProjectState =
  | 'draft'
  | 'submitted'
  | 'budget_review'
  | 'matching'
  | 'awaiting_professional_responses'
  | 'shortlist_review'
  | 'shortlist_ready'
  | 'professional_selected'
  | 'proposal_pending'
  | 'proposal_accepted'
  | 'contract_pending'
  | 'awaiting_signatures'
  | 'awaiting_deposit'
  | 'active_phase_1'
  | 'phase_1_review'
  | 'awaiting_final_payment'
  | 'active_phase_2'
  | 'final_review'
  | 'completed'
  | 'cancelled'
  | 'paused'
  | 'disputed';

export interface Money {
  amountMinor: number; // Always in smallest currency unit (e.g. cents)
  currency: string;    // e.g. 'EUR'
}

/**
 * Service Taxonomy Models
 */
export interface ProjectTypeOption {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface FeatureOption {
  id: string;
  name: string;
  description?: string;
  recommended?: boolean;
}

export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName?: string;
  active: boolean;
  sortOrder: number;
  projectTypes: ProjectTypeOption[];
  featureOptions: FeatureOption[];
}

export interface IndustryOption {
  id: string;
  name: string;
}

export interface ProjectGoalOption {
  id: string;
  name: string;
  description?: string;
}

export interface ExistingAssetOption {
  id: string;
  name: string;
  description?: string;
}

/**
 * Timeline & Budget Models
 */
export type TimelineStartOption =
  | 'asap'
  | 'two_weeks'
  | 'one_month'
  | 'flexible'
  | 'specific_date';

export type TimelineDurationOption =
  | 'flexible'
  | 'two_four_weeks'
  | 'one_two_months'
  | 'two_three_months'
  | 'three_plus_months'
  | 'specific_date';

export type TimelineFlexibility =
  | 'fixed'
  | 'somewhat_flexible'
  | 'very_flexible';

export interface ProjectTimeline {
  preferredStart: TimelineStartOption;
  startDate?: string; // ISO date string (YYYY-MM-DD)
  desiredCompletion: TimelineDurationOption;
  completionDate?: string; // ISO date string (YYYY-MM-DD)
  flexibility: TimelineFlexibility;
}

export interface BudgetRangeOption {
  id: string;
  label: string;
  minAmountMinor: number;
  maxAmountMinor: number | null;
  currency: string;
  openEnded?: boolean;
}

export interface ProjectBudget {
  budgetType: 'range' | 'unsure';
  selectedRangeId?: string;
  minAmountMinor?: number;
  maxAmountMinor?: number | null;
  currency: string;
  isIndicative: boolean; // Always true
}

export interface ProjectAttachment {
  fileId: string;
  projectId: string;
  uploaderId: string;
  name: string;
  storagePath: string;
  downloadUrl?: string;
  contentType: string;
  size: number;
  createdAt: string;
}

/**
 * Structured Client Project Brief
 */
export interface ProjectBrief {
  serviceId: string;
  projectTypeId: string;
  title: string;
  description: string;
  businessName: string;
  existingUrl?: string;
  industryId?: string;
  customIndustry?: string;
  targetAudience?: string;
  goals: string[];
  customGoals?: string;
  features: string[];
  customFeatures?: string;
  existingAssets: string[];
  customAssets?: string;
  timeline: ProjectTimeline;
  budget: ProjectBudget;
  additionalDetails?: string;
  attachments: ProjectAttachment[];
}

/**
 * Core Project Entity (Firestore: projects/{projectId})
 */
export interface Project {
  id: string;
  clientId: string;
  clientName?: string;
  clientCompanyName?: string;
  title: string;
  serviceId: string;
  projectTypeId: string;
  brief: ProjectBrief;
  status: ProjectState;
  currentStep: number;
  draftCompletedSteps: number[];
  version: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  selectedProfessionalId?: string;
  selectedQuoteId?: string;
  selectedShortlistId?: string;
  selectedAt?: string;
  currentProposalId?: string;
  currentContractId?: string;
}

/**
 * Immutable Brief Snapshot (Firestore: projects/{projectId}/briefSnapshots/{snapshotId})
 */
export interface ProjectBriefSnapshot {
  id: string;
  projectId: string;
  clientId: string;
  version: number;
  brief: ProjectBrief;
  statusAtSnapshot: ProjectState;
  reason: 'initial_submission' | 'scope_amendment';
  createdAt: string;
  createdBy: string;
}

/**
 * Activity Events (Firestore: activityEvents/{eventId} or subcollection)
 */
export interface ActivityEvent {
  id: string;
  projectId: string;
  actorId: string;
  actorRole: UserRole;
  actorName?: string;
  eventType: 'project_created' | 'project_updated' | 'project_submitted' | string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * ==========================================
 * Phase 3: Matching, Opportunities & Quotes
 * ==========================================
 */

export type EligibilityStatus = 'eligible' | 'ineligible';

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  warnings: string[];
}

export type MatchStatus =
  | 'candidate'
  | 'opportunity_pending'
  | 'opportunity_sent'
  | 'responded'
  | 'passed'
  | 'expired'
  | 'admin_removed'
  | 'excluded'
  | 'shortlisted'
  | 'selected'
  | 'not_selected';

export interface ScoreBreakdown {
  serviceAndSkills: number;   // max 30
  relevantExperience: number; // max 20
  availability: number;       // max 20
  budgetFit: number;          // max 15
  ratingReliability: number;  // max 10
  workload: number;           // max 5
  total: number;              // 0 - 100
}

export interface ProjectMatch {
  id: string;
  projectId: string;
  professionalId: string;
  professionalName: string;
  professionalTitle: string;
  professionalCountry: string;
  professionalTimezone: string;
  professionalAvatarUrl?: string;
  verificationStatus: VerificationStatus;
  availabilityStatus: AvailabilityStatus;
  nextAvailableDate: string;
  minimumBudgetMinor: number;
  currency: string;
  eligibilityStatus: EligibilityStatus;
  eligibilityReasons: string[];
  matchScore: number; // 0 - 100
  scoreBreakdown: ScoreBreakdown;
  matchReasons: string[];
  warnings: string[];
  matchingVersion: string; // 'v1'
  status: MatchStatus;
  opportunityId?: string;
  excludedAt?: string;
  excludedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityStatus =
  | 'pending'
  | 'viewed'
  | 'interested'
  | 'alternative_proposal'
  | 'passed'
  | 'expired'
  | 'withdrawn'
  | 'selected'
  | 'not_selected';

export type OpportunityResponseType =
  | 'standard_quote'
  | 'alternative_proposal'
  | 'pass';

export interface OpportunityProjectSnapshot {
  projectId: string;
  serviceId: string;
  serviceName: string;
  projectTypeId: string;
  projectTypeName: string;
  title: string;
  description: string;
  industryName?: string;
  goals: string[];
  features: string[];
  existingAssets: string[];
  indicativeBudget: ProjectBudget;
  timeline: ProjectTimeline;
  attachments: {
    fileId: string;
    name: string;
    contentType: string;
    size: number;
    downloadUrl?: string;
  }[];
}

export type PassReason =
  | 'not_available'
  | 'budget_too_low'
  | 'scope_not_fit'
  | 'timeline_not_fit'
  | 'outside_expertise'
  | 'workload'
  | 'other';

export interface Opportunity {
  id: string;
  projectId: string;
  professionalId: string;
  matchId: string;
  projectSnapshotId?: string;
  status: OpportunityStatus;
  projectSnapshot: OpportunityProjectSnapshot;
  matchReasons: string[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  viewedAt?: string;
  respondedAt?: string;
  responseType?: OpportunityResponseType;
  quoteId?: string;
  passReason?: PassReason;
  passNote?: string;
  createdBy: string;
}

export type QuoteType = 'standard' | 'alternative';

export type QuoteStatus =
  | 'submitted'
  | 'withdrawn'
  | 'expired'
  | 'selected'
  | 'not_selected';

export type BudgetRelation =
  | 'within_budget'
  | 'slightly_above'
  | 'materially_above';

export interface Quote {
  id: string;
  projectId: string;
  opportunityId: string;
  matchId: string;
  professionalId: string;
  quoteType: QuoteType;
  amountMinor: number; // in cents
  currency: string;
  scopeSummary: string;
  includedItems: string[];
  excludedItems: string[];
  proposedStartDate: string;
  estimatedDurationDays: number;
  revisionsIncluded: number;
  note?: string;
  alternativeExplanation?: string;
  budgetRelation: BudgetRelation;
  status: QuoteStatus;
  version: number;
  createdAt: string;
  submittedAt: string;
  updatedAt: string;
}

/**
 * ==========================================
 * Phase 4: Shortlist, Selection & Notifications
 * ==========================================
 */

export type ShortlistStatus =
  | 'draft'
  | 'ready'
  | 'published'
  | 'selection_made'
  | 'expired'
  | 'superseded';

export interface ShortlistEligibilityResult {
  eligible: boolean;
  reasons: string[];
  warnings: string[];
}

export interface ShortlistCandidateSnapshot {
  professionalId: string;
  matchId: string;
  opportunityId: string;
  quoteId: string;

  // Professional snapshot (ensures future profile edits do not alter historical presentation)
  professional: {
    id: string;
    displayName: string;
    professionalTitle: string;
    shortBio: string;
    country: string;
    timezone: string;
    languages: string[];
    yearsOfExperience: number;
    completedProjectCount?: number;
    averageRating?: number;
    skills: string[];
    primaryServices: string[];
    portfolioItems?: PortfolioItem[];
  };

  // Availability snapshot
  availability: {
    availabilityStatus: AvailabilityStatus;
    nextAvailableDate: string;
    currentActiveProjectCount?: number;
  };

  // Quote snapshot
  quote: {
    id: string;
    quoteType: QuoteType;
    amountMinor: number;
    currency: string;
    scopeSummary: string;
    includedItems: string[];
    excludedItems: string[];
    proposedStartDate: string;
    estimatedDurationDays: number;
    revisionsIncluded: number;
    note?: string;
    alternativeExplanation?: string;
    budgetRelation: BudgetRelation;
    submittedAt: string;
  };

  // Client-safe natural language explanation (NO raw match score)
  clientSafeMatchReason: string;
  keyMatchHighlights: string[];

  // Ordering & Recommendation
  orderIndex: number;
  isRecommended?: boolean;
  recommendationRationale?: string;
}

/**
 * Internal Shortlist (Admin Only: projects/{projectId}/shortlists/{shortlistId})
 */
export interface InternalShortlist {
  id: string;
  projectId: string;
  clientId: string;
  status: ShortlistStatus;
  candidateIds: string[];
  items: {
    professionalId: string;
    matchId: string;
    opportunityId: string;
    quoteId: string;
    matchScore: number;
    scoreBreakdown: ScoreBreakdown;
    internalMatchReasons: string[];
    adminNotes?: string;
    isRecommended?: boolean;
    recommendationRationale?: string;
    orderIndex: number;
  }[];
  adminNotes?: string;
  overrideApplied?: boolean;
  overrideReason?: string;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  selectedProfessionalId?: string;
  selectedAt?: string;
}

/**
 * Client-Safe Published Shortlist (projects/{projectId}/publishedShortlist/current)
 * Strictly zero competitor price leakage or internal match scores
 */
export interface PublishedShortlist {
  id: string;
  projectId: string;
  clientId: string;
  shortlistId: string;
  version: number;
  status: 'published' | 'selection_made' | 'expired';
  publishedAt: string;
  expiresAt?: string;
  candidates: ShortlistCandidateSnapshot[];
  selectedProfessionalId?: string;
  selectedAt?: string;
}

/**
 * Client Selection Record (projects/{projectId}/selection/current)
 */
export interface ProfessionalSelection {
  id: string;
  projectId: string;
  shortlistId: string;
  shortlistVersion: number;
  professionalId: string;
  quoteId: string;
  matchId: string;
  opportunityId: string;
  selectedBy: string; // client user id
  selectedAt: string;
  selectionSnapshot: {
    professionalName: string;
    professionalTitle: string;
    amountMinor: number;
    currency: string;
    quoteType: QuoteType;
    scopeSummary: string;
    includedItems: string[];
    excludedItems: string[];
    proposedStartDate: string;
    estimatedDurationDays: number;
    revisionsIncluded: number;
    note?: string;
    alternativeExplanation?: string;
  };
}

/**
 * In-App Notifications (notifications/{notificationId})
 */
export type NotificationType =
  | 'shortlist_ready'
  | 'professional_selected'
  | 'not_selected'
  | 'opportunity_received'
  | 'quote_submitted'
  | 'proposal_pending'
  | 'proposal_change_requested'
  | 'proposal_accepted'
  | 'contract_ready_for_signature'
  | 'contract_partially_signed'
  | 'contract_fully_signed'
  | 'admin_alert'
  | 'general';

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * ==========================================
 * Phase 5: Final Proposal & Contract Architecture
 * ==========================================
 */

export type ProposalStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'accepted'
  | 'superseded'
  | 'cancelled';

export interface ProposalDeliverable {
  id: string;
  title: string;
  description: string;
  phase: 1 | 2;
  estimatedDueDays: number;
  acceptanceCriteria: string[];
}

export interface ProposalMilestone {
  id: string;
  title: string;
  description: string;
  phase: 1 | 2;
  order: number;
  amountMinor: number;
  percentage: number;
  acceptanceCriteria: string[];
  revisionsAllowed: number;
}

export interface ProposalCommercialTerms {
  totalAmountMinor: number;
  currency: string;
  phase1AmountMinor: number;
  phase1Percentage: number;
  phase2AmountMinor: number;
  phase2Percentage: number;
  revisionsIncluded: number;
  revisionPolicy: string;
  proposedStartDate: string;
  estimatedDurationDays: number;
  estimatedCompletionDate: string;
}

export interface PartyAcceptance {
  accepted: boolean;
  acceptedBy: string; // userId
  acceptedByName: string;
  acceptedAt: string; // ISO string
  ipAddress?: string;
  userAgent?: string;
  typedName?: string;
}

export type ChangeRequestCategory =
  | 'scope'
  | 'pricing'
  | 'timeline'
  | 'milestones'
  | 'revisions'
  | 'other';

export interface ProposalChangeRequest {
  id: string;
  proposalId: string;
  proposalVersion: number;
  projectId: string;
  requestedBy: string; // userId
  requestedByRole: UserRole;
  requestedByName: string;
  category: ChangeRequestCategory;
  message: string;
  suggestedChanges?: {
    field: string;
    requestedValue: string;
    reason?: string;
  }[];
  status: 'open' | 'addressed' | 'declined';
  adminResponse?: string;
  resolvedAt?: string;
  createdAt: string;
}

/**
 * Final Proposal (Firestore: proposals/{proposalId})
 */
export interface Proposal {
  id: string;
  projectId: string;
  clientId: string;
  professionalId: string;
  selectedQuoteId: string;
  selectedShortlistId: string;
  sourceBriefSnapshotId: string;
  version: number;
  status: ProposalStatus;
  title: string;
  scopeSummary: string;
  deliverables: ProposalDeliverable[];
  exclusions: string[];
  assumptions: string[];
  clientResponsibilities: string[];
  commercialTerms: ProposalCommercialTerms;
  milestones: ProposalMilestone[];
  specialTerms: string[];
  clientAcceptance?: PartyAcceptance;
  professionalAcceptance?: PartyAcceptance;
  changeRequests?: ProposalChangeRequest[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sentForReviewAt?: string;
  acceptedAt?: string;
  supersededByProposalId?: string;
}

export type ContractStatus =
  | 'draft'
  | 'generated'
  | 'awaiting_signatures'
  | 'partially_signed'
  | 'fully_signed'
  | 'cancelled'
  | 'superseded';

export interface ContractLegalSection {
  id: string;
  sectionNumber: string;
  title: string;
  content: string;
}

export interface ContractPartySnapshot {
  userId: string;
  fullName: string;
  email: string;
  companyName?: string;
  country: string;
  role: 'client' | 'professional';
}

export interface ContractSigner {
  signerId: string;
  userId: string;
  role: 'client' | 'professional';
  name: string;
  email: string;
  status: 'pending' | 'signed' | 'declined';
  signedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  ipAddress?: string;
  userAgent?: string;
  typedSignature?: string;
  verificationCode?: string;
}

export interface ContractAuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  actorRole: string;
  details?: string;
  ipAddress?: string;
}

export interface ContractESignatureData {
  provider: 'alongby_dev_simulation' | 'alongby_esignature_v1' | 'docusign' | 'hellosign';
  envelopeId: string;
  status: 'created' | 'sent' | 'partially_signed' | 'completed' | 'declined';
  mode: 'test_simulation' | 'production';
  isDevelopmentOnly?: boolean;
  providerNotice: string;
  signers: ContractSigner[];
  createdAt: string;
  completedAt?: string;
  auditLog: ContractAuditEntry[];
}

/**
 * Formal Commercial Contract (Firestore: contracts/{contractId})
 */
export interface Contract {
  id: string;
  contractNumber: string; // e.g. ALB-2026-000101
  projectId: string;
  proposalId: string;
  proposalVersion: number;
  clientId: string;
  professionalId: string;
  contractVersion: number;
  status: ContractStatus;
  templateVersion: string; // e.g. 'v1.0.0-standard-commercial'
  termsVersion: string; // e.g. 'v2026.1-platform-terms'
  proposalSnapshot: Proposal; // Complete immutable snapshot of the accepted proposal
  clientSnapshot: ContractPartySnapshot;
  professionalSnapshot: ContractPartySnapshot;
  projectTitle: string;
  legalSections: ContractLegalSection[];
  eSignature: ContractESignatureData;
  documentFingerprint: string; // SHA-256 hash or deterministic checksum
  generatedAt: string;
  fullySignedAt?: string;
  createdAt: string;
  updatedAt: string;
}



