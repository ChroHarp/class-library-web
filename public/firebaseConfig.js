// public/firebaseConfig.js
// 只做一件事：用 Compat API 建立全域 firebase App
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDqMWLy6TkWU_7Rtahtf3LmtPBlberM928",
  authDomain: "psjh-ez-library.firebaseapp.com",
  projectId: "psjh-ez-library",
  storageBucket: "psjh-ez-library.appspot.com",
  messagingSenderId: "13575481172",
  appId: "1:13575481172:web:8b1867f3504f9154990ac1",
  measurementId: "G-G74HVG209M"
};

firebase.initializeApp(firebaseConfig);   // ← 讓 firebase.apps.length = 1

/* ↓↓↓ 這兩行是關鍵 ↓↓↓ */
window.db      = firebase.firestore();   // 全站共用 Firestore
window.storage = firebase.storage();     // 若其它頁面也要用 Storage
