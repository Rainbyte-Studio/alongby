import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

async function verifyAll() {
  console.log('=== Verifying Alongby Demo Accounts & Role Authorization ===\n');

  // 1. Client verification
  console.log('1. Testing Client Login & Document Sync...');
  const clientCred = await signInWithEmailAndPassword(
    auth,
    'demo.client@alongby.example',
    'alongby123'
  );
  console.log(`- Authenticated UID: ${clientCred.user.uid}`);
  const clientUserSnap = await getDoc(doc(db, 'users', clientCred.user.uid));
  console.log('- User document exists:', clientUserSnap.exists());
  console.log('- Role:', clientUserSnap.data()?.role);
  console.log('- Onboarding status:', clientUserSnap.data()?.onboardingStatus);

  const clientProfileSnap = await getDoc(doc(db, 'clientProfiles', clientCred.user.uid));
  console.log('- Client profile exists:', clientProfileSnap.exists());
  console.log('- Company:', clientProfileSnap.data()?.companyName);

  if (clientUserSnap.data()?.role !== 'client') {
    throw new Error('Expected role to be client');
  }

  // 2. Professional verification
  console.log('\n2. Testing Professional Login & Document Sync...');
  const profCred = await signInWithEmailAndPassword(
    auth,
    'demo.professional@alongby.example',
    'alongby123'
  );
  console.log(`- Authenticated UID: ${profCred.user.uid}`);
  const profUserSnap = await getDoc(doc(db, 'users', profCred.user.uid));
  console.log('- User document exists:', profUserSnap.exists());
  console.log('- Role:', profUserSnap.data()?.role);
  console.log('- Onboarding status:', profUserSnap.data()?.onboardingStatus);

  const profProfileSnap = await getDoc(doc(db, 'professionalProfiles', profCred.user.uid));
  console.log('- Professional profile exists:', profProfileSnap.exists());
  console.log('- Verification status:', profProfileSnap.data()?.verificationStatus);
  console.log('- Title:', profProfileSnap.data()?.professionalTitle);
  console.log('- Average rating:', profProfileSnap.data()?.averageRating);

  const availSnap = await getDoc(doc(db, 'availability', profCred.user.uid));
  console.log('- Availability exists:', availSnap.exists());
  console.log('- Availability status:', availSnap.data()?.availabilityStatus);

  if (profUserSnap.data()?.role !== 'professional') {
    throw new Error('Expected role to be professional');
  }

  // 3. Admin verification
  console.log('\n3. Testing Admin Login & Document Sync...');
  const adminCred = await signInWithEmailAndPassword(
    auth,
    'demo.admin@alongby.example',
    'alongby123'
  );
  console.log(`- Authenticated UID: ${adminCred.user.uid}`);
  const adminUserSnap = await getDoc(doc(db, 'users', adminCred.user.uid));
  console.log('- User document exists:', adminUserSnap.exists());
  console.log('- Role:', adminUserSnap.data()?.role);
  console.log('- Onboarding status:', adminUserSnap.data()?.onboardingStatus);

  if (adminUserSnap.data()?.role !== 'admin') {
    throw new Error('Expected role to be admin');
  }

  console.log('\n=== All 3 Demo Roles & Data Verified Successfully! ===');
}

verifyAll()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
