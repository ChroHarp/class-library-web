const admin = require('firebase-admin');
const fetch  = require('node-fetch');
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccount.json'))
});
const db = admin.firestore();

async function fetchIsbn(title, author='') {
  const q = encodeURIComponent(`intitle:"${title}" inauthor:"${author}"`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`;
  const res = await fetch(url);
  const j   = await res.json();
  if (!j.totalItems) return '';
  for (const it of j.items) {
    const ids = it.volumeInfo.industryIdentifiers || [];
    const i13 = ids.find(x => x.type==='ISBN_13');
    if (i13) return i13.identifier;
  }
  return '';
}

(async () => {
  const snap = await db.collection('books')
    .where('isbn','==','')
    .get();
  console.log(`Need ISBN for ${snap.size} docs…`);

  const batch = db.batch();
  for (const doc of snap.docs) {
    const d = doc.data();
    const isbn = await fetchIsbn(d.title, d.author);
    if (isbn) batch.update(doc.ref, { isbn });
  }
  await batch.commit();
  console.log('Backfill done!');
  process.exit(0);
})();
