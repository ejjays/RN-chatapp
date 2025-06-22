import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAL2_jMfD4ImycSiZCo5FyOQFbX1IcJlsQ",
  authDomain: "rn-video-call-2f903.firebaseapp.com",
  projectId: "rn-video-call-2f903",
  storageBucket: "rn-video-call-2f903.firebasestorage.app",
  messagingSenderId: "994013507567",
  appId: "1:994013507567:web:b499c47b08d533063e101a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;