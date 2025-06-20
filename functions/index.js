/**
 * 替換預設內容 — 使用 CommonJS
 * -----------------------------------------------
 * 1. require 取代 import
 * 2. module.exports 取代 export
 * 3. 全部使用 firebase-functions v1 API
 *    （Spark ➜ Blaze 皆可用；若要 v2 再另外改）
 */

const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const fetch     = require('node-fetch');    // npm install node-fetch

admin.initializeApp();
const db = admin.firestore();

/* ---------- 1. 新增書籍時，自動補資料 ---------- */
exports.fetchBookMeta = functions.firestore
  .document('books/{bookId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data.isbn || data.title) return null;   // 已填資料就略過

    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${data.isbn}`
    );
    const json = await res.json();
    if (!json.totalItems) return null;

    const info = json.items[0].volumeInfo;
    return snap.ref.update({
      title     : info.title            || '',
      author    : (info.authors || []).join('、'),
      publisher : info.publisher        || '',
    });
  });

/* ---------- 2. 封面上傳完成觸發（可選） ---------- */
exports.onCoverUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;            // e.g. covers/2025_xx.jpg
    if (!filePath.startsWith('covers/')) return null;

    // 這裡可：產生縮圖、寫 Firestore、回傳網址...
    // 若已裝官方 Resize Images 擴充，可保留為空
    return null;
  });
