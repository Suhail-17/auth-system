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
  apiKey: "AIzaSyB9fkZ1h0n65t7veCoJhNOtFLYwI3wJSmY",
  authDomain: "userauthentication-33824.firebaseapp.com",
  projectId: "userauthentication-33824",
  storageBucket: "userauthentication-33824.firebasestorage.app",
  messagingSenderId: "348061847452",
  appId: "1:348061847452:web:7f6f454866659a03688259",
  measurementId: "G-JSNT352TQ8"
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
