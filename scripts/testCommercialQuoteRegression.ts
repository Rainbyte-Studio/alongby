import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { auth, db } from '../src/services/firebase';
import { opportunityService } from '../src/services/opportunityService';
import { quoteService } from '../src/services/quoteService';
import { matchingService } from '../src/services/matchingService';
import { projectService } from '../src/services/projectService';

const CREDENTIALS = {
  admin: { email: 'demo.admin@alongby.example', pass: 'alongby123' },
  professional: { email: 'demo.professional@alongby.example', pass: 'alongby123' },
  professional2: { email: 'demo.professional2@alongby.example', pass: 'alongby123' },
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
}

async function runQuoteRegressionSuite() {
  console.log('================================================================');
  console.log('ALONGBY — PROFESSIONAL COMMERCIAL QUOTE REGRESSION SUITE');
  console.log('================================================================\n');

  // Step 0: Setup a test project and dispatch opportunities using Admin
  console.log('--- Step 0: Test Fixture Provisioning (Admin) ---');
  const adminAuth = await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);
  const adminUid = adminAuth.user.uid;

  const prof1Auth = await signInWithEmailAndPassword(auth, CREDENTIALS.professional.email, CREDENTIALS.professional.pass);
  const prof1Uid = prof1Auth.user.uid;

  const prof2Auth = await signInWithEmailAndPassword(auth, CREDENTIALS.professional2.email, CREDENTIALS.professional2.pass);
  const prof2Uid = prof2Auth.user.uid;

  // Back to Admin
  await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);

  // Create project as Client
  const clientAuth = await signInWithEmailAndPassword(auth, 'demo.client@alongby.example', 'alongby123');
  const clientUid = clientAuth.user.uid;

  const testProject = await projectService.createDraft(clientUid, 'Demo Client', 'Apex Studio', {
    title: `Regression Quote Test Project ${Date.now()}`,
    description: 'Test project for testing quote security and authorization rules.',
    serviceId: 'web_app',
    projectTypeId: 'new_webapp',
    industryId: 'fintech',
    businessName: 'Apex Studio',
    timeline: { preferredStart: 'asap', desiredCompletion: 'flexible', flexibility: 'somewhat_flexible' },
    budget: { budgetType: 'range', currency: 'EUR', minAmountMinor: 500000, maxAmountMinor: 1500000, isIndicative: true },
  });
  await projectService.submitProject(testProject.id, clientUid, 'Demo Client');
  console.log(`✓ Test project created & submitted: ${testProject.id}`);

  // Sign back in as admin
  await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);

  // Run matching
  const candidates = await matchingService.runMatchingForProject(testProject.id, adminUid);
  console.log(`✓ Matches created: ${candidates.length} candidates evaluated.`);

  const match1 = candidates.find((c) => c.professionalId === prof1Uid) || candidates[0];
  const match2 = candidates.find((c) => c.professionalId === prof2Uid) || candidates[1];

  // Dispatch opportunities
  const opp1 = await opportunityService.createOpportunity(
    testProject.id,
    prof1Uid,
    match1?.id || 'match_1',
    adminUid
  );
  const opp2 = await opportunityService.createOpportunity(
    testProject.id,
    prof2Uid,
    match2?.id || 'match_2',
    adminUid
  );
  console.log(`✓ Dispatched opp1 (${opp1.id}) to Prof1 (${prof1Uid})`);
  console.log(`✓ Dispatched opp2 (${opp2.id}) to Prof2 (${prof2Uid})`);

  // ----------------------------------------------------------------
  // 1 & 2 & 3: Demo Professional submits commercial quote
  // ----------------------------------------------------------------
  console.log('\n--- Test 1-3: Professional 1 submits commercial quote ---');
  await signInWithEmailAndPassword(auth, CREDENTIALS.professional.email, CREDENTIALS.professional.pass);
  assert(auth.currentUser?.uid === prof1Uid, 'Must be signed in as Prof1');

  const submittedQuote = await quoteService.submitQuote(
    {
      opportunityId: opp1.id,
      quoteType: 'standard',
      amountMinor: 1200000,
      currency: 'EUR',
      scopeSummary: 'Full brand identity suite with detailed guidelines.',
      includedItems: ['Brand deck', 'Component assets'],
      excludedItems: ['Merchandise manufacturing'],
      proposedStartDate: '2026-10-15',
      estimatedDurationDays: 30,
      revisionsIncluded: 3,
      note: 'Looking forward to collaborating on this project.',
    },
    prof1Uid
  );

  assert(!!submittedQuote.id, 'Quote must have an id');
  assert(submittedQuote.status === 'submitted', 'Quote status must be submitted');
  console.log(`✓ Quote ${submittedQuote.id} successfully returned from submitQuote.`);

  // ----------------------------------------------------------------
  // 4 & 5: Confirm persistence in Firestore
  // ----------------------------------------------------------------
  console.log('\n--- Test 4 & 5: Confirm Firestore Persistence & State Progression ---');
  const quoteSnap = await getDoc(doc(db, 'quotes', submittedQuote.id));
  assert(quoteSnap.exists(), 'Quote document must exist in Firestore');
  assert(quoteSnap.data().professionalId === prof1Uid, 'Quote professionalId must match');
  assert(quoteSnap.data().projectId === testProject.id, 'Quote projectId must match');
  console.log(`✓ Test 4 Passed: Quote document verified in /quotes/${submittedQuote.id}`);

  const oppSnap = await getDoc(doc(db, 'opportunities', opp1.id));
  assert(oppSnap.exists(), 'Opportunity document must exist');
  assert(oppSnap.data().status === 'interested', 'Opportunity status must be interested');
  assert(oppSnap.data().quoteId === submittedQuote.id, 'Opportunity quoteId must be linked');
  console.log(`✓ Test 5 Passed: Opportunity updated to status 'interested' with quoteId.`);

  // ----------------------------------------------------------------
  // 6 & 7: Negative Security Tests: Professional 1 CANNOT submit quote for Professional 2's opportunity
  // ----------------------------------------------------------------
  console.log('\n--- Test 6 & 7: Cross-Specialist Quote Rejection ---');
  let crossQuoteFailed = false;
  try {
    // Prof 1 attempts to submit a quote for opp2 (which belongs to Prof 2)
    await quoteService.submitQuote(
      {
        opportunityId: opp2.id,
        quoteType: 'standard',
        amountMinor: 990000,
        currency: 'EUR',
        scopeSummary: 'Malicious forged quote attempt.',
        includedItems: ['Forged'],
        excludedItems: [],
        proposedStartDate: '2026-10-15',
        estimatedDurationDays: 14,
        revisionsIncluded: 1,
      },
      prof1Uid
    );
  } catch (err: any) {
    crossQuoteFailed = true;
    console.log(`✓ Test 7 Passed: Cross-specialist quote rejected as expected: ${err.message}`);
  }
  assert(crossQuoteFailed, 'Prof1 must not be allowed to submit a quote for Prof2 opportunity');

  // Direct Firestore write attempt bypassing service
  let directForgeFailed = false;
  try {
    const fakeQuoteRef = doc(collection(db, 'quotes'));
    await setDoc(fakeQuoteRef, {
      id: fakeQuoteRef.id,
      projectId: testProject.id,
      opportunityId: opp2.id, // belongs to Prof 2
      professionalId: prof1Uid,
      status: 'submitted',
      amountMinor: 800000,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    directForgeFailed = true;
    console.log(`✓ Direct Firestore quote forge for mismatched opportunity rejected: ${err.message}`);
  }
  assert(directForgeFailed, 'Direct Firestore rule must reject quote creation for mismatched opportunity');

  // ----------------------------------------------------------------
  // 8: Immutable field tampering rejection
  // ----------------------------------------------------------------
  console.log('\n--- Test 8: Immutable Field Protection ---');
  // Attempt to tamper with immutable root project fields as Professional
  let projectTamperFailed = false;
  try {
    await updateDoc(doc(db, 'projects', testProject.id), {
      status: 'completed',
      title: 'Hacked Title by Professional',
    });
  } catch (err: any) {
    projectTamperFailed = true;
    console.log(`✓ Project tampering by Professional correctly rejected: ${err.message}`);
  }
  assert(projectTamperFailed, 'Professional must not be allowed to mutate project fields');

  // Attempt to tamper with immutable opportunity fields
  let oppTamperFailed = false;
  try {
    await updateDoc(doc(db, 'opportunities', opp1.id), {
      professionalId: 'hacked_professional_id',
      projectId: 'hacked_project_id',
    });
  } catch (err: any) {
    oppTamperFailed = true;
    console.log(`✓ Opportunity immutable field tampering correctly rejected: ${err.message}`);
  }
  assert(oppTamperFailed, 'Professional must not be allowed to tamper with immutable opportunity routing fields');

  console.log('\n================================================================');
  console.log('ALL 8 COMMERCIAL QUOTE AUTHORIZATION & REGRESSION TESTS PASSED!');
  console.log('================================================================');

  process.exit(0);
}

runQuoteRegressionSuite().catch((err) => {
  console.error('\n❌ REGRESSION SUITE FAILED:', err);
  process.exit(1);
});
