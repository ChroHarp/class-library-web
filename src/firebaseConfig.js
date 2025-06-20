// src/firebaseConfig.js  —— 只做一件事：初始化 Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage }   from 'firebase/storage';

const firebaseConfig = {
  apiKey       : import.meta.env.FIREBASE_API_KEY,
  projectId    : import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET,
  authDomain   : `${import.meta.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
};

const app     = initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const storage = getStorage(app);
