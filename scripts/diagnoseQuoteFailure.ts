import { signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../src/services/firebase';
import { opportunityService } from '../src/services/opportunityService';
import { quoteService } from '../src/services/quoteService';

const CREDENTIALS = {
  admin: { email: 'demo.admin@alongby.example', pass: 'alongby123' },
  professional: { email: 'demo.professional@alongby.example', pass: 'alongby123' },
};

async function runTest() {
  console.log('=== PRECISE TRACE OF PROFESSIONAL QUOTE SUBMISSION ===\n');

  // Step 1: Admin creates fresh project & dispatches opportunity to demo.professional
  const adminCred = await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);
  const adminUid = adminCred.user.uid;

  const profCred = await signInWithEmailAndPassword(auth, CREDENTIALS.professional.email, CREDENTIALS.professional.pass);
  const profUid = profCred.user.uid;

  // Back to admin
  await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);
  
  // Find a project or create one
  const pSnap = await getDocs(collection(db, 'projects'));
  const targetProject = pSnap.docs[0].data();
  const projectId = pSnap.docs[0].id;
  console.log(`Using Project: ${projectId}`);

  // Create match doc if needed, or dispatch opportunity
  const matchId = `match_test_${Date.now()}`;
  await setDoc(doc(db, 'projects', projectId, 'matches', matchId), {
    id: matchId,
    projectId,
    professionalId: profUid,
    professionalName: 'Demo Professional',
    professionalTitle: 'Senior Specialist',
    professionalCountry: 'United Kingdom',
    professionalTimezone: 'Europe/London',
    verificationStatus: 'verified',
    availabilityStatus: 'available',
    nextAvailableDate: '2026-10-01',
    minimumBudgetMinor: 50000,
    currency: 'EUR',
    eligibilityStatus: 'eligible',
    eligibilityReasons: ['Verified'],
    matchScore: 92,
    scoreBreakdown: { serviceSkills: 40, experience: 20, availability: 15, budgetFit: 10, ratingReliability: 5, workload: 2, total: 92 },
    matchReasons: ['Strong fit'],
    warnings: [],
    matchingVersion: 'v1',
    status: 'eligible',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const opp = await opportunityService.createOpportunity(
    projectId,
    profUid,
    matchId,
    adminUid,
    7
  );
  console.log(`Dispatched Opportunity ${opp.id} (status: ${opp.status}) to Professional ${profUid}`);

  // Step 2: Authenticate as Professional
  await signInWithEmailAndPassword(auth, CREDENTIALS.professional.email, CREDENTIALS.professional.pass);
  console.log(`\nSwitched session to Professional (${profUid})`);

  // Step 3: Professional marks opportunity viewed (as the UI does)
  console.log('\n--- Professional marks opportunity viewed ---');
  try {
    await opportunityService.markOpportunityViewed(opp.id, profUid);
    console.log('✓ markOpportunityViewed succeeded.');
  } catch (err: any) {
    console.error('✗ markOpportunityViewed FAILED:', err.message);
  }

  // Step 4: Trace quote submission step by step
  console.log('\n--- Tracing quoteService.submitQuote execution path ---');

  // Trace 4A: getDoc(opportunity)
  try {
    const fetchedOpp = await opportunityService.getOpportunity(opp.id, profUid);
    console.log(`✓ 4A: Read Opportunity: ${fetchedOpp?.id}, status=${fetchedOpp?.status}`);
  } catch (err: any) {
    console.error('✗ 4A: Read Opportunity FAILED:', err.message);
  }

  // Trace 4B: Create Quote
  const quoteRef = doc(collection(db, 'quotes'));
  const nowIso = new Date().toISOString();
  const quotePayload = {
    id: quoteRef.id,
    projectId: opp.projectId,
    opportunityId: opp.id,
    matchId: opp.matchId,
    professionalId: profUid,
    quoteType: 'standard',
    amountMinor: 1400000,
    currency: 'EUR',
    scopeSummary: 'Detailed implementation scope for the project engagement.',
    includedItems: ['Deliverable 1', 'Deliverable 2'],
    excludedItems: ['Exclusion 1'],
    proposedStartDate: '2026-10-01',
    estimatedDurationDays: 30,
    revisionsIncluded: 2,
    note: '',
    alternativeExplanation: '',
    budgetRelation: 'within_budget',
    status: 'submitted',
    version: 1,
    createdAt: nowIso,
    submittedAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await setDoc(quoteRef, quotePayload);
    console.log(`✓ 4B: setDoc(/quotes/${quoteRef.id}) SUCCEEDED`);
  } catch (err: any) {
    console.error(`✗ 4B: setDoc(/quotes/${quoteRef.id}) FAILED:`, err.message);
  }

  // Trace 4C: Update Opportunity
  const oppRef = doc(db, 'opportunities', opp.id);
  try {
    await updateDoc(oppRef, {
      status: 'interested',
      quoteId: quoteRef.id,
      responseType: 'standard_quote',
      respondedAt: nowIso,
      updatedAt: nowIso,
    });
    console.log(`✓ 4C: updateDoc(/opportunities/${opp.id}) SUCCEEDED`);
  } catch (err: any) {
    console.error(`✗ 4C: updateDoc(/opportunities/${opp.id}) FAILED:`, err.message);
  }

  // Trace 4D: Update Match status
  const matchRef = doc(db, 'projects', opp.projectId, 'matches', opp.matchId);
  try {
    await updateDoc(matchRef, {
      status: 'responded',
      updatedAt: nowIso,
    });
    console.log(`✓ 4D: updateDoc(/projects/${opp.projectId}/matches/${opp.matchId}) SUCCEEDED`);
  } catch (err: any) {
    console.error(`✗ 4D: updateDoc(/projects/${opp.projectId}/matches/${opp.matchId}) FAILED:`, err.message);
  }

  // Trace 4E: Project activity
  const actRef = doc(collection(db, 'projects', opp.projectId, 'activityEvents'));
  try {
    await setDoc(actRef, {
      id: actRef.id,
      projectId: opp.projectId,
      actorId: profUid,
      actorRole: 'professional',
      actorName: 'Demo Professional',
      eventType: 'quote_submitted',
      title: 'Quote submitted',
      description: 'Quote submitted by matched professional.',
      metadata: { quoteId: quoteRef.id },
      createdAt: nowIso,
    });
    console.log(`✓ 4E: setDoc(/projects/${opp.projectId}/activityEvents/${actRef.id}) SUCCEEDED`);
  } catch (err: any) {
    console.error(`✗ 4E: setDoc(/projects/${opp.projectId}/activityEvents) FAILED:`, err.message);
  }

  // Trace 4F: Audit event
  const auditRef = doc(collection(db, 'auditEvents'));
  try {
    await setDoc(auditRef, {
      id: auditRef.id,
      actorId: profUid,
      actorRole: 'professional',
      eventType: 'QUOTE_SUBMITTED',
      targetType: 'quote',
      targetId: quoteRef.id,
      metadata: { projectId: opp.projectId },
      timestamp: nowIso,
    });
    console.log(`✓ 4F: setDoc(/auditEvents/${auditRef.id}) SUCCEEDED`);
  } catch (err: any) {
    console.error(`✗ 4F: setDoc(/auditEvents) FAILED:`, err.message);
  }

  console.log('\n=== DIAGNOSIS COMPLETE ===');
  process.exit(0);
}

runTest().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
