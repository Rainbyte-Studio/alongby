import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/services/firebase';

const CREDENTIALS = {
  admin: { email: 'demo.admin@alongby.example', pass: 'alongby123' },
};

async function inspectProjects() {
  await signInWithEmailAndPassword(auth, CREDENTIALS.admin.email, CREDENTIALS.admin.pass);
  console.log('Signed in as admin');

  const pSnap = await getDocs(collection(db, 'projects'));
  console.log('Total projects:', pSnap.docs.length);

  for (const d of pSnap.docs) {
    const data = d.data();
    if (data.title?.toLowerCase().includes('dros') || data.title?.toLowerCase().includes('test')) {
      console.log('\n----------------------------------------');
      console.log('Project ID:', d.id);
      console.log('Title:', data.title);
      console.log('Status:', data.status);
      console.log('ClientId:', data.clientId);
      console.log('ShortlistId:', data.shortlistId);
      console.log('Created:', data.createdAt);

      // Check subcollections
      const shortlistsSnap = await getDocs(collection(db, 'projects', d.id, 'shortlists'));
      console.log(`Subcollection 'shortlists' count:`, shortlistsSnap.docs.length);
      shortlistsSnap.docs.forEach((s) => {
        console.log('  Shortlist subdoc:', s.id, 'status:', s.data().status, 'items count:', s.data().items?.length);
      });

      const pubShortlistSnap = await getDocs(collection(db, 'projects', d.id, 'publishedShortlist'));
      console.log(`Subcollection 'publishedShortlist' count:`, pubShortlistSnap.docs.length);
      pubShortlistSnap.docs.forEach((s) => {
        console.log('  publishedShortlist subdoc:', s.id, 'status:', s.data().status, 'candidates count:', s.data().candidates?.length);
      });
    }
  }

  // Inspect Test Project Dros specifically
  const drosDoc = await getDoc(doc(db, 'projects', 'OoejaWY3AGyO41wbVIex'));
  console.log('\n=== Test Project Dros Details ===');
  console.log('Project Data:', drosDoc.data());

  const clientUserDoc = await getDoc(doc(db, 'users', drosDoc.data()?.clientId));
  console.log('Client User Data:', clientUserDoc.data());

  const currentPubSnap = await getDoc(doc(db, 'projects', 'OoejaWY3AGyO41wbVIex', 'publishedShortlist', 'current'));
  console.log('Published Shortlist Exists:', currentPubSnap.exists());
  if (currentPubSnap.exists()) {
    const pubData = currentPubSnap.data();
    console.log('Published Shortlist Data:', JSON.stringify(pubData, null, 2));
  }

  process.exit(0);
}

inspectProjects().catch((err) => {
  console.error(err);
  process.exit(1);
});
