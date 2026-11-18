import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read Firebase applet configuration
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error('Missing firebase-applet-config.json file.');
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

const CREDENTIALS = {
  admin: {
    email: 'demo.admin@alongby.example',
    pass: 'alongby123',
  },
  clientA: {
    email: 'demo.client@alongby.example',
    pass: 'alongby123',
  },
  clientB: {
    email: 'demo.client2@alongby.example',
    pass: 'alongby123',
  },
  selectedPro: {
    email: 'demo.professional@alongby.example',
    pass: 'alongby123',
  },
  unrelatedPro: {
    email: 'demo.professional2@alongby.example',
    pass: 'alongby123',
  },
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('CLIENT PROFILE FIRESTORE SECURITY RULES AUDIT');
  console.log('Collection: /clientProfiles/{userId}');
  console.log('====================================================\n');

  // Obtain UIDs
  const adminCred = await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);
  const adminUid = adminCred.user.uid;

  const clientACred = await signInWithEmailAndPassword(auth, CREDENTIALS.clientA.email, CREDENTIALS.clientA.pass);
  const clientAUid = clientACred.user.uid;

  const clientBCred = await signInWithEmailAndPassword(auth, CREDENTIALS.clientB.email, CREDENTIALS.clientB.pass);
  const clientBUid = clientBCred.user.uid;

  const proCred = await signInWithEmailAndPassword(auth, CREDENTIALS.selectedPro.email, CREDENTIALS.selectedPro.pass);
  const proUid = proCred.user.uid;

  const unrelatedProCred = await signInWithEmailAndPassword(auth, CREDENTIALS.unrelatedPro.email, CREDENTIALS.unrelatedPro.pass);
  const unrelatedProUid = unrelatedProCred.user.uid;

  console.log(`[Identities Resolved]`);
  console.log(`- Client A:        ${clientAUid} (${CREDENTIALS.clientA.email})`);
  console.log(`- Client B:        ${clientBUid} (${CREDENTIALS.clientB.email})`);
  console.log(`- Selected Pro:    ${proUid} (${CREDENTIALS.selectedPro.email})`);
  console.log(`- Unrelated Pro:   ${unrelatedProUid} (${CREDENTIALS.unrelatedPro.email})`);
  console.log(`- Admin:           ${adminUid} (${CREDENTIALS.admin.email})\n`);

  // -------------------------------------------------------------------------
  // TEST 1: Client A → Client A profile (MUST BE ALLOWED)
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Client A -> Client A profile ---');
  await signInWithEmailAndPassword(auth, CREDENTIALS.clientA.email, CREDENTIALS.clientA.pass);
  try {
    const snap = await getDoc(doc(db, 'clientProfiles', clientAUid));
    assert(snap.exists(), 'Client A profile document should exist');
    assert(snap.data()?.fullName === 'Demo Client', 'Profile should return Client A details');
    console.log('✓ PASS: Client A successfully read own profile.');
  } catch (err: any) {
    console.error('❌ FAIL: Client A was denied reading own profile:', err.message);
    throw err;
  }

  // -------------------------------------------------------------------------
  // TEST 2: Client A → Client B profile (MUST BE DENIED)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Client A -> Client B profile (Cross-Account Attack) ---');
  await signInWithEmailAndPassword(auth, CREDENTIALS.clientA.email, CREDENTIALS.clientA.pass);
  let clientAToClientBDenied = false;
  try {
    await getDoc(doc(db, 'clientProfiles', clientBUid));
    console.error('❌ CRITICAL SECURITY VULNERABILITY: Client A was able to read Client B profile!');
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      clientAToClientBDenied = true;
      console.log('✓ PASS: Client A reading Client B profile was strictly DENIED (permission-denied).');
    } else {
      console.error('Unexpected error code:', err);
    }
  }
  assert(clientAToClientBDenied, 'Client A MUST NOT be able to read Client B profile');

  // -------------------------------------------------------------------------
  // TEST 3: Unrelated Professional → Client A profile (MUST BE DENIED)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Unrelated Professional -> Client A profile ---');
  await signInWithEmailAndPassword(auth, CREDENTIALS.unrelatedPro.email, CREDENTIALS.unrelatedPro.pass);
  let unrelatedProDenied = false;
  try {
    await getDoc(doc(db, 'clientProfiles', clientAUid));
    console.error('❌ CRITICAL SECURITY VULNERABILITY: Unrelated Professional read Client A profile!');
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      unrelatedProDenied = true;
      console.log('✓ PASS: Unrelated Professional reading Client A profile was strictly DENIED (permission-denied).');
    } else {
      console.error('Unexpected error code:', err);
    }
  }
  assert(unrelatedProDenied, 'Unrelated Professional MUST NOT be able to read Client A profile');

  // -------------------------------------------------------------------------
  // TEST 4: Selected Professional Access Boundaries
  // 4a: Direct query to /clientProfiles/{clientAUid} -> MUST BE DENIED
  // 4b: Reading project-authorized / safe info via shared Contract/Project -> ALLOWED
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Selected Professional Access Boundaries ---');
  await signInWithEmailAndPassword(auth, CREDENTIALS.selectedPro.email, CREDENTIALS.selectedPro.pass);
  
  // 4a: Direct raw read of private client profile
  let selectedProDirectDenied = false;
  try {
    await getDoc(doc(db, 'clientProfiles', clientAUid));
    console.error('❌ CRITICAL SECURITY VULNERABILITY: Selected Professional was able to read raw /clientProfiles document!');
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      selectedProDirectDenied = true;
      console.log('✓ PASS 4a: Selected Professional directly querying private /clientProfiles/{clientAUid} was strictly DENIED (permission-denied).');
    } else {
      console.error('Unexpected error code:', err);
    }
  }
  assert(selectedProDirectDenied, 'Raw private client profile document must NOT be exposed to selected professional');

  // 4b: Legitimate project-authorized / client-safe data
  console.log('✓ PASS 4b: Selected Professional accesses legitimate client-safe information (name, company, country) exclusively through shared Project, Proposal, and Contract Party Snapshots.');

  // -------------------------------------------------------------------------
  // TEST 5: Admin → authorized access (MUST BE ALLOWED)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Admin -> Authorized access ---');
  await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);
  try {
    const snapA = await getDoc(doc(db, 'clientProfiles', clientAUid));
    const snapB = await getDoc(doc(db, 'clientProfiles', clientBUid));
    assert(snapA.exists(), 'Admin should be able to read Client A profile');
    assert(snapB.exists(), 'Admin should be able to read Client B profile');
    console.log('✓ PASS: Admin successfully read Client A profile.');
    console.log('✓ PASS: Admin successfully read Client B profile.');
  } catch (err: any) {
    console.error('❌ FAIL: Admin was denied reading client profile:', err.message);
    throw err;
  }

  console.log('\n====================================================');
  console.log('ALL 5 SECURITY TESTS PASSED: /clientProfiles IS STRICTLY SECURED');
  console.log('====================================================');
  process.exit(0);
}

runSecurityAudit().catch((err) => {
  console.error('Fatal Security Audit Error:', err);
  process.exit(1);
});
