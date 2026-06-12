import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD2OgZ2NhDXEGgROdJT4nklGriXBaDm17Y",
  authDomain: "inventory-management-5f438.firebaseapp.com",
  projectId: "inventory-management-5f438",
  storageBucket: "inventory-management-5f438.firebasestorage.app",
  messagingSenderId: "134164350522",
  appId: "1:134164350522:web:bf089fbfe4f7a93ea45703",
  measurementId: "G-KM73DPQWQJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Auth and Cloud Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export { analytics, firebaseConfig };

export default app;
