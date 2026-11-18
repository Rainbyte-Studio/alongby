# Alongby — Architecture & Technical Specification

This document records the architectural foundation established in **Phase 1** for Alongby, a curated managed marketplace connecting clients with carefully vetted digital and creative professionals.

---

## 1. Project Folder Architecture

```
/
├── firestore.rules                     # Deployed Firestore Security Rules enforcing RBAC
├── firebase-applet-config.json         # Firebase project configuration & database ID
├── firebase-blueprint.json             # Core data schema & entity dictionary
├── docs/
│   └── ARCHITECTURE.md                 # Architecture, security & lifecycle documentation
├── src/
│   ├── types/                          # Strictly typed domain models & interfaces
│   │   └── index.ts                    # UserProfile, Profiles, Availability, Money, ProjectState
│   ├── services/                       # Data access, auth, persistence & audit layers
│   │   ├── firebase.ts                 # Firebase App, Auth & named Firestore initialization
│   │   ├── authService.ts              # Session management, registration, sign in/out
│   │   ├── profileService.ts           # Client & Professional profiles, Admin reviews
│   │   ├── availabilityService.ts      # Structured professional capacity & availability
│   │   └── auditService.ts             # Immutable audit trail for business mutations
│   ├── context/
│   │   └── AuthContext.tsx             # Global auth state, profile caching, session restoration
│   ├── components/
│   │   ├── ui/                         # Editorial design system primitives (WCAG AA compliant)
│   │   │   ├── Button.tsx              # Standardized 2:1 horizontal-to-vertical padding math
│   │   │   ├── Input.tsx               # High-contrast label, error & helper states
│   │   │   ├── Textarea.tsx            # Form area with responsive sizing
│   │   │   ├── Select.tsx              # Standardized dropdown select
│   │   │   ├── Badge.tsx               # Neutral, success, warning, error, info variants
│   │   │   ├── Card.tsx                # Soft surface cards without excessive nesting
│   │   │   ├── Modal.tsx               # Accessible dialog with ESC & backdrop dismissal
│   │   │   ├── EmptyState.tsx          # Functional empty states (no fake metrics)
│   │   │   ├── PageHeader.tsx          # Consistent typography & action slots
│   │   │   ├── LoadingSpinner.tsx      # Smooth non-blocking loading indicator
│   │   │   └── Tabs.tsx                # Accessible tab navigation with badges
│   │   ├── layout/
│   │   │   ├── Navbar.tsx              # Editorial header with auth triggers & dev tools
│   │   │   ├── Footer.tsx              # Restrained footer with product principles
│   │   │   └── DashboardLayout.tsx     # Role-aware dashboard shell & status banners
│   │   └── auth/
│   │       ├── AuthModal.tsx           # Role-based signup & signin with demo helpers
│   │       ├── ProtectedRoute.tsx      # Authentication & onboarding completion guard
│   │       └── RoleGuard.tsx           # Route restriction ensuring zero cross-role leakage
│   ├── pages/
│   │   ├── LandingPage.tsx             # Editorial SaaS landing ("Your project. The right professional.")
│   │   ├── onboarding/
│   │   │   ├── ClientOnboardingPage.tsx       # Persisted client profile onboarding
│   │   │   └── ProfessionalOnboardingPage.tsx # Persisted professional profile & availability
│   │   ├── client/
│   │   │   └── ClientDashboardPage.tsx        # Client project overview & empty state
│   │   ├── professional/
│   │   │   └── ProfessionalDashboardPage.tsx  # Profile, live availability editor & opportunities
│   │   └── admin/
│   │       └── AdminDashboardPage.tsx         # Professional verification & matching queue
│   ├── App.tsx                         # Router configuration & top-level layout
│   ├── main.tsx                        # React 19 entry point
│   └── index.css                       # Tailwind CSS configuration
```

---

## 2. Current Firestore Collections (Phase 1)

1. **`users/{userId}`**
   - Base identity record linked 1:1 with Firebase Authentication UID.
   - Fields: `id`, `email`, `displayName`, `role` (`'client' | 'professional' | 'admin'`), `accountStatus` (`'active' | 'pending' | 'suspended' | 'disabled'`), `onboardingStatus` (`'pending' | 'completed'`), `createdAt`, `updatedAt`.
2. **`clientProfiles/{userId}`**
   - Client organizational metadata.
   - Fields: `userId`, `fullName`, `companyName`, `companyWebsite`, `country`, `timezone`, `createdAt`, `updatedAt`.
3. **`professionalProfiles/{userId}`**
   - Structured professional profile used for curation scoring.
   - Fields: `userId`, `displayName`, `professionalTitle`, `shortBio`, `country`, `timezone`, `languages`, `primaryServices`, `skills`, `yearsOfExperience`, `minimumBudgetMinor`, `currency`, `verificationStatus` (`'draft' | 'submitted' | 'under_review' | 'verified' | 'rejected'`), `completedProjectCount`, `averageRating`.
4. **`availability/{userId}`**
   - Real capacity signals.
   - Fields: `userId`, `availabilityStatus` (`'available' | 'limited' | 'fully_booked' | 'unavailable'`), `nextAvailableDate`, `maximumConcurrentProjects`, `currentActiveProjectCount`, `updatedAt`.
5. **`auditEvents/{eventId}`**
   - Immutable audit trail.
   - Fields: `actorId`, `actorRole`, `eventType`, `targetType`, `targetId`, `metadata`, `timestamp`.

---

## 3. Important Domain Entities Planned for Later Phases

- **`projects`**: Project brief metadata, service taxonomy, indicative budget, timeline, current `ProjectState`.
- **`opportunities`**: Private opportunities dispatched to matched professionals (Interested / Alternative / Pass).
- **`quotes`**: Structured commercial quotes submitted by interested professionals (amountMinor, inclusions, exclusions, timeline).
- **`shortlists`**: Curated shortlist of 2–3 professionals presented to the client with match rationale.
- **`proposals`**: Versioned final commercial agreement prior to contract generation.
- **`contracts`**: Immutable legal and commercial terms, IP provisions, and signing states.
- **`milestones`**: Phase 1 (Deposit) and Phase 2 (Final delivery) milestones with revision requests.
- **`payments` & `payouts`**: Staged payment tracking in minor currency units (cents) with fee schedules.

---

## 4. Role & Permission Approach

- Roles: `client`, `professional`, `admin`.
- **Zero Frontend Role Trust**: On registration, users can only choose `client` or `professional`. The `admin` role can NEVER be self-assigned in public registration.
- **Role Guards**: Frontend navigation uses `RoleGuard` to forbid clients from accessing professional views, professionals from accessing client views, and non-admins from accessing admin views.
- **Development Helper**: For sandbox evaluation, a dedicated `setRoleForDev` method is provided in the Auth context to test role boundaries safely.

---

## 5. Security Rules Strategy (`firestore.rules`)

- **Default Deny**: All unmatched collections are strictly closed (`allow read, write: if false;`).
- **Users**: Users can read their own record. Users cannot modify their `role` or `accountStatus` (protected from privilege escalation). Admins have complete read/write access.
- **Professional Profiles**: Only owners or admins can edit. Crucially, professionals CANNOT set their own `verificationStatus` to `verified`—only an admin can verify a practitioner.
- **Audit Logs**: Authenticated users can append records where `actorId == request.auth.uid`. Records are strictly immutable (no update or delete).

---

## 6. Future Server-Side Privileged Operations

For later phases, server-authoritative operations will be implemented in a dedicated server-side environment (Node.js/Express) to prevent untrusted browser mutations:
1. **Curated Matching Scoring**: Algorithmic scoring of verified professionals against project briefs.
2. **Contract Generation & State Transition**: Advancing project state to `active_phase_1` only when both signatures and payment funding are verified.
3. **Escrow / Payment Webhook Handling**: Verifying payment provider webhook signatures and triggering eligibility for payout releases.
4. **Dispute Freezes**: Atomically locking milestone payouts upon dispute initiation.

---

## 7. Project State-Machine Strategy

Project lifecycles avoid boolean flags and strictly transition through legal states:
```
draft
  → submitted
  → budget_review
  → matching
  → awaiting_professional_responses
  → shortlist_review
  → shortlist_ready
  → professional_selected
  → proposal_pending
  → proposal_accepted
  → contract_pending
  → awaiting_signatures
  → awaiting_deposit
  → active_phase_1
  → phase_1_review
  → awaiting_final_payment
  → active_phase_2
  → final_review
  → completed
```
Exceptional branches: `cancelled`, `paused`, `disputed`.

---

## 8. Planned Payment Adapter Boundary

The payment boundary will abstract payment provider specifics:
- Interface: `PaymentGatewayAdapter`
  - `createCustomerAccount(userId, metadata)`
  - `createPaymentIntent(projectId, phase, amountMinor, currency)`
  - `handleWebhook(payload, signatureHeader)`
  - `releasePhasePayout(paymentId, professionalAccountId)`
  - `issueRefund(paymentId, amountMinor)`
- Monetary values: strictly stored as integer `amountMinor` (cents) to eliminate floating-point rounding errors.

---

## 9. Planned E-Signature Adapter Boundary

The electronic signature boundary will decouple Alongby from specific vendors (e.g. DocuSign, HelloSign):
- Interface: `SignatureProviderAdapter`
  - `createSignatureEnvelope(contractId, documentPdfUrl, signers: [client, professional])`
  - `handleSignatureWebhook(payload, signature)`
  - `downloadCompletedContract(envelopeId)`
  - `getAuditCertificate(envelopeId)`
