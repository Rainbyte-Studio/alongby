/**
 * ALONGBY — COMPLETE PHASE 1–5 END-TO-END VERIFICATION SUITE
 * 
 * Verifies the complete Alongby workflow from account authentication
 * through fully executed electronic contract.
 * 
 * Enforces:
 * 1. Test Environment (Auth for Client, Professional, and Admin test users)
 * 2. Client & Professional Profile / Availability Verification
 * 3. Client Project Creation & Brief Submission
 * 4. Matching Engine (Eligibility, scoring, and candidate surfacing)
 * 5. Opportunity Dispatch & Professional Quote Submission (Integer minor units)
 * 6. Admin Shortlist (Evaluation, minimum candidate constraints, publication)
 * 7. Client Specialist Selection (Comparative review and selection)
 * 8. Proposal Formulation (Proposal v1, 2-stage staged payment terms, integer minor units)
 * 9. Proposal Review & Change Request (Proposal v1 status becomes changes_requested)
 * 10. Proposal Revision (Proposal v2 active, Proposal v1 preserved as superseded)
 * 11. Mutual Proposal Acceptance (Client and Specialist acceptances)
 * 12. Contract Generation & Fingerprint Immutability (SHA-256 fingerprint, terms snapshots)
 * 13. Electronic Signature Execution (Client and Specialist parallel execution, audit log)
 * 14. Pre-Execution Governance (Status held at 'awaiting_deposit', zero active work before deposit)
 */

import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/services/firebase';
import { projectService } from '../src/services/projectService';
import { matchingService } from '../src/services/matchingService';
import { opportunityService } from '../src/services/opportunityService';
import { quoteService } from '../src/services/quoteService';
import { shortlistService } from '../src/services/shortlistService';
import { proposalService } from '../src/services/proposalService';
import { contractService } from '../src/services/contractService';
import { profileService } from '../src/services/profileService';
import { availabilityService } from '../src/services/availabilityService';

const CREDENTIALS = {
  client: { email: 'demo.client@alongby.example', pass: 'alongby123' },
  professional: { email: 'demo.professional@alongby.example', pass: 'alongby123' },
  professional2: { email: 'demo.professional2@alongby.example', pass: 'alongby123' },
  professional3: { email: 'demo.professional3@alongby.example', pass: 'alongby123' },
  admin: { email: 'demo.admin@alongby.example', pass: 'alongby123' },
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
}

async function runE2E() {
  console.log('====================================================');
  console.log('ALONGBY — PHASE 1–5 END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // 1. TEST ENVIRONMENT & AUTHENTICATION
  // ----------------------------------------------------
  console.log('--- Step 1: Authentication & Role Verification ---');
  
  const clientCred = await signInWithEmailAndPassword(auth, CREDENTIALS.client.email, CREDENTIALS.client.pass);
  const clientUid = clientCred.user.uid;
  console.log(`✓ Client authenticated: ${CREDENTIALS.client.email} (${clientUid})`);

  const profCred = await signInWithEmailAndPassword(auth, CREDENTIALS.professional.email, CREDENTIALS.professional.pass);
  const profUid = profCred.user.uid;
  console.log(`✓ Specialist authenticated: ${CREDENTIALS.professional.email} (${profUid})`);

  const adminCred = await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);
  const adminUid = adminCred.user.uid;
  console.log(`✓ Admin authenticated: ${CREDENTIALS.admin.email} (${adminUid})`);

  // Verify Roles in Firestore
  const clientUserDoc = await getDoc(doc(db, 'users', clientUid));
  assert(clientUserDoc.exists() && clientUserDoc.data().role === 'client', 'Client role must be client');
  
  const profUserDoc = await getDoc(doc(db, 'users', profUid));
  assert(profUserDoc.exists() && profUserDoc.data().role === 'professional', 'Professional role must be professional');

  const adminUserDoc = await getDoc(doc(db, 'users', adminUid));
  assert(adminUserDoc.exists() && adminUserDoc.data().role === 'admin', 'Admin role must be admin');
  console.log('✓ All accounts resolve to verified roles in Firestore.');

  // ----------------------------------------------------
  // 2. PROFESSIONAL PROFILE & AVAILABILITY VERIFICATION
  // ----------------------------------------------------
  console.log('\n--- Step 2: Professional Profile & Availability Verification ---');
  const profProfile = await profileService.getProfessionalProfile(profUid);
  assert(!!profProfile, 'Professional profile must exist');
  assert(profProfile!.verificationStatus === 'verified', 'Professional profile must be verified');
  console.log(`✓ Specialist profile: ${profProfile!.displayName}, Status: ${profProfile!.verificationStatus}`);

  const profAvail = await availabilityService.getAvailability(profUid);
  assert(!!profAvail, 'Professional availability record must exist');
  assert(profAvail!.availabilityStatus === 'available', 'Professional must be available');
  console.log(`✓ Specialist availability: ${profAvail!.availabilityStatus}, Max Concurrent: ${profAvail!.maximumConcurrentProjects}`);

  // ----------------------------------------------------
  // 3. CLIENT PROJECT CREATION & SUBMISSION
  // ----------------------------------------------------
  console.log('\n--- Step 3: Client Project Creation & Submission ---');
  await signInWithEmailAndPassword(auth, CREDENTIALS.client.email, CREDENTIALS.client.pass);

  const testProject = await projectService.createDraft(clientUid, 'Demo Client', 'Apex Digital Studio', {
    title: `E2E FinTech Mobile & Web Platform ${Date.now().toString(36)}`,
    description: 'Comprehensive financial dashboard and client management web portal requiring senior TypeScript and UI architecture.',
    serviceId: 'web_app',
    projectTypeId: 'new_webapp',
    industryId: 'fintech',
    businessName: 'Apex Digital Studio',
    targetAudience: 'Institutional traders, corporate finance teams, and modern fintech consumers.',
    goals: ['Scalable modular architecture', 'Enterprise-grade security and reliability', 'Sub-second real-time dashboards'],
    features: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Firebase'],
    timeline: {
      preferredStart: 'asap',
      desiredCompletion: 'flexible',
      flexibility: 'somewhat_flexible',
    },
    budget: {
      budgetType: 'range',
      currency: 'EUR',
      minAmountMinor: 1000000,
      maxAmountMinor: 2000000,
      isIndicative: true,
    },
  });

  assert(testProject.status === 'draft', 'Newly created project must be in draft status');
  assert(testProject.brief.budget.maxAmountMinor === 2000000, 'Max budget must be exactly 2000000 integer minor units');
  assert(Number.isInteger(testProject.brief.budget.minAmountMinor!), 'Budget must be an integer');
  console.log(`✓ Project draft created: ${testProject.title} (ID: ${testProject.id})`);

  // Submit project
  const submittedProject = await projectService.submitProject(testProject.id, clientUid, 'Demo Client');
  assert(submittedProject.status === 'submitted', 'Project status must transition to submitted');
  console.log(`✓ Project submitted for matching: Status is ${submittedProject.status}`);

  // ----------------------------------------------------
  // 4. MATCHING ENGINE
  // ----------------------------------------------------
  console.log('\n--- Step 4: Matching Engine Execution ---');
  await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);

  const matches = await matchingService.runMatchingForProject(submittedProject.id, adminUid);
  assert(matches.length >= 1, 'Matching engine must return eligible candidates');
  console.log(`✓ Matching engine identified ${matches.length} candidates:`);
  matches.forEach((m, idx) => {
    console.log(`  [${idx + 1}] ${m.professionalName} (Score: ${m.matchScore}/100, Status: ${m.eligibilityStatus})`);
  });

  const targetMatch = matches.find((m) => m.professionalId === profUid);
  assert(!!targetMatch, 'Demo professional must be among matched specialists');
  assert(targetMatch!.eligibilityStatus === 'eligible', 'Demo professional must be eligible');

  // ----------------------------------------------------
  // 5. OPPORTUNITY DISPATCH & QUOTE SUBMISSIONS
  // ----------------------------------------------------
  console.log('\n--- Step 5: Opportunity Dispatch & Professional Quotes ---');
  // Admin dispatches opportunities to candidates that have test credentials available
  const candidatesToQuote = matches
    .filter(
      (m) =>
        m.professionalId === profUid ||
        m.professionalName.includes('Elena') ||
        m.professionalName.includes('Marcus')
    )
    .slice(0, 3);
  const oppResults: { candidate: typeof matches[0]; oppId: string }[] = [];

  for (const candidate of candidatesToQuote) {
    const opp = await opportunityService.createOpportunity(
      submittedProject.id,
      candidate.professionalId,
      candidate.id,
      adminUid
    );
    console.log(`✓ Admin dispatched opportunity ${opp.id} to ${candidate.professionalName}`);
    oppResults.push({ candidate, oppId: opp.id });
  }

  // Each candidate authenticates and submits their quote
  const quoteResults: { profId: string; quoteId: string }[] = [];
  for (const { candidate, oppId } of oppResults) {
    let cred = CREDENTIALS.professional;
    if (candidate.professionalId === profUid) {
      cred = CREDENTIALS.professional;
    } else if (candidate.professionalName.includes('Elena')) {
      cred = CREDENTIALS.professional2;
    } else if (candidate.professionalName.includes('Marcus')) {
      cred = CREDENTIALS.professional3;
    }

    const authResult = await signInWithEmailAndPassword(auth, cred.email, cred.pass);
    const quoteAmountMinor = candidate.professionalId === profUid ? 1400000 : 1450000;

    const submittedQuote = await quoteService.submitQuote(
      {
        opportunityId: oppId,
        quoteType: 'standard',
        amountMinor: quoteAmountMinor,
        currency: 'EUR',
        scopeSummary: `Comprehensive full-lifecycle engineering for ${submittedProject.title} with high-assurance testing.`,
        includedItems: [
          'Design System tokens and WCAG AA component library',
          'Responsive FinTech dashboard with sub-second metrics',
          'Automated end-to-end and integration tests',
        ],
        excludedItems: ['Native mobile app store submissions', 'Third-party banking licensing fees'],
        proposedStartDate: '2026-10-01',
        estimatedDurationDays: 45,
        revisionsIncluded: 2,
        note: 'Ready to kick off immediately upon contract and deposit clearance.',
      },
      candidate.professionalId
    );

    assert(submittedQuote.status === 'submitted', 'Quote must be in submitted status');
    assert(Number.isInteger(submittedQuote.amountMinor), 'Quote amount must be integer minor units');
    quoteResults.push({ profId: candidate.professionalId, quoteId: submittedQuote.id });
    console.log(`  ✓ Specialist ${candidate.professionalName} authenticated & submitted quote €${submittedQuote.amountMinor / 100}`);
  }

  // ----------------------------------------------------
  // 6. ADMIN SHORTLIST & PUBLICATION
  // ----------------------------------------------------
  console.log('\n--- Step 6: Admin Shortlist & Publication ---');
  await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);

  const candidateIds = candidatesToQuote.map((c) => c.professionalId);
  const draftShortlist = await shortlistService.saveDraftShortlist(
    submittedProject.id,
    candidateIds,
    adminUid,
    {
      recommendedProfId: profUid,
      recommendationRationale: 'Deepest experience in high-performance FinTech dashboards and TypeScript architecture.',
      adminNotes: 'All 3 specialists verified and ready for engagement.',
    }
  );
  assert(draftShortlist.candidateIds.length >= 2, 'Shortlist must contain at least 2 candidates');
  console.log(`✓ Admin prepared internal shortlist with ${draftShortlist.candidateIds.length} specialists.`);

  const published = await shortlistService.publishShortlist(
    submittedProject.id,
    draftShortlist.id,
    adminUid
  );
  assert(published.status === 'published', 'Shortlist must be published');
  assert(published.candidates.length >= 2, 'Published shortlist must have at least 2 candidates');
  console.log(`✓ Shortlist published to client with ${published.candidates.length} candidates.`);

  // ----------------------------------------------------
  // 7. CLIENT COMPARISON & SPECIALIST SELECTION
  // ----------------------------------------------------
  console.log('\n--- Step 7: Client Specialist Selection ---');
  await signInWithEmailAndPassword(auth, CREDENTIALS.client.email, CREDENTIALS.client.pass);

  const clientShortlist = await shortlistService.getPublishedShortlist(submittedProject.id);
  assert(!!clientShortlist, 'Client must be able to view published shortlist');
  console.log(`✓ Client viewed comparative shortlist (${clientShortlist!.candidates.length} candidates).`);

  const selection = await shortlistService.selectProfessional(
    submittedProject.id,
    profUid,
    clientUid,
    'Demo Client'
  );
  assert(selection.professionalId === profUid, 'Selection must match chosen professional');

  const projectAfterSelect = await projectService.getProject(submittedProject.id);
  assert(projectAfterSelect!.status === 'professional_selected', 'Project must be in professional_selected status');
  console.log(`✓ Client selected specialist: ${profProfile!.displayName}. Project status: ${projectAfterSelect!.status}`);

  // ----------------------------------------------------
  // 8. PROPOSAL FORMULATION (PROPOSAL v1)
  // ----------------------------------------------------
  console.log('\n--- Step 8: Proposal Formulation (v1) ---');
  // Specialist or Admin initializes Proposal v1
  await signInWithEmailAndPassword(auth, CREDENTIALS.professional.email, CREDENTIALS.professional.pass);

  const proposalV1 = await proposalService.initializeProposalFromSelection(
    submittedProject.id,
    profUid
  );

  assert(proposalV1.version === 1, 'Initial proposal must be version 1');
  assert(proposalV1.status === 'pending_review', 'Proposal v1 status must be pending_review');
  assert(proposalV1.commercialTerms.totalAmountMinor === 1400000, 'Total consideration must be 1400000 minor units (€14,000.00)');
  assert(
    proposalV1.commercialTerms.phase1AmountMinor + proposalV1.commercialTerms.phase2AmountMinor ===
      proposalV1.commercialTerms.totalAmountMinor,
    'Phase 1 + Phase 2 amounts must equal total'
  );
  console.log(`✓ Proposal v1 formulated: ID=${proposalV1.id}, Version=${proposalV1.version}, Status=${proposalV1.status}`);
  console.log(`  Phase 1 Staged Hold: €${proposalV1.commercialTerms.phase1AmountMinor / 100} (${proposalV1.commercialTerms.phase1Percentage}%)`);
  console.log(`  Phase 2 Final Hold:  €${proposalV1.commercialTerms.phase2AmountMinor / 100} (${proposalV1.commercialTerms.phase2Percentage}%)`);

  // ----------------------------------------------------
  // 9. PROPOSAL CHANGE REQUEST (PROPOSAL v1 -> v2)
  // ----------------------------------------------------
  console.log('\n--- Step 9: Proposal Change Request & Versioning ---');
  // Client submits change request on Proposal v1
  await signInWithEmailAndPassword(auth, CREDENTIALS.client.email, CREDENTIALS.client.pass);

  const cr = await proposalService.submitChangeRequest(proposalV1.id, {
    projectId: submittedProject.id,
    requestedBy: clientUid,
    requestedByRole: 'client',
    requestedByName: 'Demo Client',
    category: 'timeline',
    message: 'Please adjust the delivery timeline to 40 calendar days and explicitly include cross-browser QA in Phase 2.',
    suggestedChanges: [
      { field: 'timeline', requestedValue: '40 days' },
      { field: 'scope', requestedValue: 'Cross-browser & cross-device QA signoff' },
    ],
  });

  assert(cr.status === 'open', 'Change request must be recorded as open');
  
  const propV1AfterCr = await proposalService.getProposal(proposalV1.id);
  assert(propV1AfterCr!.status === 'changes_requested', 'Proposal v1 status must be changes_requested');
  console.log(`✓ Change request submitted by Client: category '${cr.category}'`);
  console.log(`✓ Proposal v1 status updated to: '${propV1AfterCr!.status}'`);

  // Specialist publishes Proposal v2 addressing feedback
  console.log('\nSpecialist publishes Proposal v2 addressing feedback...');
  await signInWithEmailAndPassword(auth, CREDENTIALS.professional.email, CREDENTIALS.professional.pass);

  const proposalV2 = await proposalService.createRevisedVersion(
    proposalV1.id,
    {
      scopeSummary: `${proposalV1.scopeSummary} (Revised with dedicated cross-browser QA).`,
      commercialTerms: {
        ...proposalV1.commercialTerms,
        estimatedDurationDays: 40,
      },
    },
    profUid
  );

  assert(proposalV2.version === 2, 'Revised proposal must have version 2');
  assert(proposalV2.status === 'pending_review', 'Proposal v2 must have status pending_review');
  assert(proposalV2.commercialTerms.estimatedDurationDays === 40, 'Revised duration must be 40 days');
  assert(!proposalV2.clientAcceptance?.accepted, 'Proposal v2 client acceptance must be fresh (not accepted)');
  assert(!proposalV2.professionalAcceptance?.accepted, 'Proposal v2 specialist acceptance must be fresh (not accepted)');

  // Verify Proposal v1 remains preserved and immutable
  const propV1Superseded = await proposalService.getProposal(proposalV1.id);
  assert(propV1Superseded!.status === 'superseded', 'Proposal v1 must be marked superseded');
  assert(propV1Superseded!.supersededByProposalId === proposalV2.id, 'Proposal v1 must reference Proposal v2');
  console.log(`✓ Proposal v1 is immutable and preserved in history (status: '${propV1Superseded!.status}')`);
  console.log(`✓ Proposal v2 active (ID: ${proposalV2.id}, Version: ${proposalV2.version}, Status: '${proposalV2.status}')`);

  // ----------------------------------------------------
  // 10. MUTUAL PROPOSAL ACCEPTANCE
  // ----------------------------------------------------
  console.log('\n--- Step 10: Mutual Proposal Acceptance ---');
  // Client accepts Proposal v2
  await signInWithEmailAndPassword(auth, CREDENTIALS.client.email, CREDENTIALS.client.pass);
  const clientAcceptedV2 = await proposalService.acceptProposal(
    proposalV2.id,
    'client',
    clientUid,
    { typedName: 'Demo Client (Authorized Signatory)' }
  );
  assert(clientAcceptedV2.clientAcceptance?.accepted === true, 'Client acceptance flag must be true');
  assert(clientAcceptedV2.status === 'pending_review', 'Status remains pending until both parties accept');
  console.log('✓ Client accepted Proposal v2.');

  // Specialist accepts Proposal v2
  await signInWithEmailAndPassword(auth, CREDENTIALS.professional.email, CREDENTIALS.professional.pass);
  const fullyAcceptedV2 = await proposalService.acceptProposal(
    proposalV2.id,
    'professional',
    profUid,
    { typedName: 'Demo Professional (Lead Architect)' }
  );
  assert(fullyAcceptedV2.professionalAcceptance?.accepted === true, 'Professional acceptance flag must be true');
  assert(fullyAcceptedV2.status === 'accepted', 'Proposal status must transition to accepted upon mutual agreement');
  console.log('✓ Specialist accepted Proposal v2.');
  console.log(`✓ Proposal v2 mutually accepted! Status: '${fullyAcceptedV2.status}'`);

  // ----------------------------------------------------
  // 11. CONTRACT GENERATION & IMMUTABILITY
  // ----------------------------------------------------
  console.log('\n--- Step 11: Contract Generation & Immutability ---');
  const contract = await contractService.generateContractFromAcceptedProposal(proposalV2.id, profUid);

  assert(!!contract, 'Contract must exist');
  assert(contract.status === 'awaiting_signatures', 'Contract must be in awaiting_signatures status');
  assert(contract.contractNumber.startsWith('ALB-2026-'), 'Contract number must be properly formatted');
  assert(contract.documentFingerprint.length >= 16, 'Contract SHA-256 fingerprint must be present');
  assert(contract.proposalVersion === 2, 'Contract must reference Proposal version 2');
  assert(contract.legalSections.length >= 8, 'Contract must contain all mandated legal sections');
  assert(contract.proposalSnapshot.scopeSummary.includes('cross-browser QA'), 'Schedule A must reflect Proposal v2');
  console.log(`✓ Contract generated: ${contract.contractNumber}`);
  console.log(`  Document Fingerprint: ${contract.documentFingerprint}`);
  console.log(`  Legal Sections: ${contract.legalSections.length} legal clauses`);
  console.log(`  Template Version: ${contract.templateVersion}, Terms Version: ${contract.termsVersion}`);

  // ----------------------------------------------------
  // 12. ELECTRONIC SIGNATURES EXECUTION
  // ----------------------------------------------------
  console.log('\n--- Step 12: Electronic Signatures Execution ---');
  // Specialist signs first
  const signedByProf = await contractService.executeSignature(
    contract.id,
    'professional',
    profUid,
    {
      typedSignature: 'Demo Professional',
      acceptedTerms: true,
    }
  );
  const profSigner = signedByProf.eSignature.signers.find((s) => s.role === 'professional');
  assert(profSigner?.status === 'signed', 'Specialist signature status must be signed');
  assert(signedByProf.status === 'partially_signed', 'Contract becomes partially_signed after first party');
  console.log(`✓ Specialist signature executed at ${profSigner?.signedAt}`);

  // Client signs second
  await signInWithEmailAndPassword(auth, CREDENTIALS.client.email, CREDENTIALS.client.pass);
  const fullySigned = await contractService.executeSignature(
    contract.id,
    'client',
    clientUid,
    {
      typedSignature: 'Demo Client',
      acceptedTerms: true,
    }
  );

  const clientSigner = fullySigned.eSignature.signers.find((s) => s.role === 'client');
  assert(clientSigner?.status === 'signed', 'Client signature status must be signed');
  assert(fullySigned.status === 'fully_signed', 'Contract status must be fully_signed');
  assert(fullySigned.eSignature.status === 'completed', 'eSignature envelope status must be completed');
  assert(fullySigned.eSignature.auditLog.length >= 2, 'Audit log must record all electronic signature events');
  console.log(`✓ Client signature executed at ${clientSigner?.signedAt}`);
  console.log(`✓ Contract is now FULLY EXECUTED (status: '${fullySigned.status}')`);

  // ----------------------------------------------------
  // 13. PRE-EXECUTION GOVERNANCE & LIFECYCLE BOUNDARY
  // ----------------------------------------------------
  console.log('\n--- Step 13: Pre-Execution Governance & Phase 6 Boundary ---');
  const finalProjectDoc = await getDoc(doc(db, 'projects', submittedProject.id));
  const finalProject = finalProjectDoc.data();
  assert(!!finalProject, 'Final project document must exist');
  assert(finalProject!.status === 'awaiting_deposit', 'Project status must be awaiting_deposit after contract execution');
  assert(finalProject!.status !== 'in_progress', 'CRITICAL: Project must NOT be in_progress before Phase 6 deposit');
  assert(finalProject!.status !== 'active', 'CRITICAL: Project must NOT be active before Phase 6 deposit');
  console.log(`✓ Project status is strictly held at: '${finalProject!.status}'`);
  console.log('✓ Staged Payment Protection Governance verified: Zero work is active before Phase 6 deposit confirmation.');

  console.log('\n====================================================');
  console.log('ALL PHASES 1–5 END-TO-END TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ E2E VERIFICATION SUITE FAILED:', err);
    process.exit(1);
  });
