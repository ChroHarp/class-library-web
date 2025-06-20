/**
 * Cloud Functions（CommonJS v1）
 * -------------------------------------------------
 *  ‣ 若已在專案設定好 service.*，用 cert() 明確初始化
 *  ‣ 若尚未設定，退回預設 initializeApp()（Functions 內建 SA）
 */

const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const fetch     = require('node-fetch');          // npm i node-fetch@2

/* ---------- 初始化 Admin SDK ---------- */
(() => {
  const svc = functions.config().service || {};
  if (svc.account_email && svc.private_key) {
    // 已設定 => 使用明確私鑰
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId  : process.env.GCLOUD_PROJECT,
        clientEmail: svc.account_email,
        privateKey : svc.private_key.replace(/\\n/g, '\n'),
      }),
      storageBucket: 'psjh-ez-library.appspot.com',
    });
    console.log('✔ Admin SDK 以 service.* 私鑰初始化');
  } else {
    // 未設定 => 用內建預設憑證
    admin.initializeApp();
    console.log('ℹ 未偵測到 service.*，使用預設憑證');
  }
})();

const db = admin.firestore();

/* ---------- 1. 新增書籍時自動補欄位 ---------- */
exports.fetchBookMeta = functions.firestore
  .document('books/{bookId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data.isbn || data.title) return null;   // 已有資料就跳過

    try {
      const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${data.isbn}`);
      const j = await r.json();
      if (!j.totalItems) return null;

      const v = j.items[0].volumeInfo;
      return snap.ref.update({
        title     : v.title             || '',
        author    : (v.authors || []).join('、'),
        publisher : v.publisher         || '',
      });
    } catch (err) {
      console.error('Google Books API 失敗', err);
      return null;
    }
  });

/* ---------- 2. 封面上傳完成（可接縮圖擴充） ---------- */
exports.onCoverUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    if (!object.name.startsWith('covers/')) return null;
    // 這裡如需額外處理再寫；若已裝官方 resize-images，可留空
    return null;
  });
