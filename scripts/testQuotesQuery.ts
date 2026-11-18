import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../src/services/firebase';

const CREDENTIALS = {
  professional: { email: 'demo.professional@alongby.example', pass: 'alongby123' },
};

async function testQuery() {
  await signInWithEmailAndPassword(auth, CREDENTIALS.professional.email, CREDENTIALS.professional.pass);
  console.log('Signed in as professional');

  console.log('Testing query without professionalId constraint:');
  try {
    const q1 = query(collection(db, 'quotes'), where('opportunityId', '==', 'test_opp_id'));
    const snap1 = await getDocs(q1);
    console.log('q1 succeeded! Docs found:', snap1.docs.length);
  } catch (err: any) {
    console.error('q1 failed:', err.message);
  }

  console.log('Testing query WITH professionalId constraint:');
  try {
    const q2 = query(
      collection(db, 'quotes'),
      where('opportunityId', '==', 'test_opp_id'),
      where('professionalId', '==', auth.currentUser!.uid)
    );
    const snap2 = await getDocs(q2);
    console.log('q2 succeeded! Docs found:', snap2.docs.length);
  } catch (err: any) {
    console.error('q2 failed:', err.message);
  }

  process.exit(0);
}

testQuery().catch(console.error);
