import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Declare global window property for development mode
declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Only initialize Firestore in production mode
const db = process.env.NODE_ENV === 'production' ? getFirestore(app) : null;

// Initialize test mode for development
if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode - Firestore operations will be mocked');
  
  // Set up mock confirmation result for testing
  window.confirmationResult = {
    confirm: (code: string) => {
      if (code === '123456') {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Invalid code'));
    }
  };

  // Initialize registered phones if not exists
  if (!localStorage.getItem('registeredPhones')) {
    localStorage.setItem('registeredPhones', '[]');
  }
}

export { auth, db };
export default app;
