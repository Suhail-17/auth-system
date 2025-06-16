import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCredential,
  setPersistence,
  browserLocalPersistence,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserDocument, getUserDocument } from '../lib/db';

interface AuthContextType {
  currentUser: User | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPhoneVerification: (phoneNumber: string, isSignUp?: boolean) => Promise<any>;
  verifyPhoneCode: (verificationId: string, code: string, phoneNumber?: string) => Promise<void>;
  checkExistingPhone: (phoneNumber: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email || user?.phoneNumber || 'No user');
      
      if (!user && isDevelopment) {
        // Check for stored mock user in development mode
        const storedMockUser = localStorage.getItem('mockUser');
        if (storedMockUser) {
          const mockUser = JSON.parse(storedMockUser) as User;
          console.log('Development mode: Restoring mock user:', mockUser);
          setCurrentUser(mockUser);
          setLoading(false);
          return;
        }
      }

      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        delete (window as any).recaptchaVerifier;
      }
    };
  }, []);

  const checkExistingPhone = async (phoneNumber: string): Promise<boolean> => {
    if (isDevelopment) {
      // In development, check localStorage for registered phone numbers
      const registeredPhones = JSON.parse(localStorage.getItem('registeredPhones') || '[]');
      console.log('Development mode: Checking phone number:', phoneNumber);
      console.log('Registered phones:', registeredPhones);
      return registeredPhones.includes(phoneNumber);
    }

    try {
      // Firebase stores phone auth users with a special email format
      const methods = await fetchSignInMethodsForEmail(auth, `${phoneNumber}@phone.firebase.com`);
      console.log('Sign-in methods for phone:', methods);
      return methods.length > 0;
    } catch (error) {
      console.error('Error checking phone number:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Sign up successful:', result.user.email);
      
      // Create user document in Firestore
      await createUserDocument(result.user.uid, {
        email: result.user.email,
        authProvider: 'email',
        emailVerified: result.user.emailVerified
      });
      
      setCurrentUser(result.user);
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered');
      }
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.email);
      setCurrentUser(result.user);
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        throw new Error('Invalid email or password');
      }
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (isDevelopment) {
        // Clean up mock user in development mode
        localStorage.removeItem('mockUser');
      }
      await signOut(auth);
      setCurrentUser(null);
      console.log('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to log out');
    }
  };

  const sendPhoneVerification = async (phoneNumber: string, isSignUp = false) => {
    try {
      if (isSignUp) {
        const exists = await checkExistingPhone(phoneNumber);
        if (exists) {
          throw new Error('This phone number is already registered');
        }
      } else {
        // For sign-in, verify that the phone number exists
        const exists = await checkExistingPhone(phoneNumber);
        if (!exists) {
          throw new Error('This phone number is not registered. Please sign up first.');
        }
      }

      if (isDevelopment) {
        console.log('Development mode: Simulating OTP send to:', phoneNumber);
        return {
          verificationId: 'test-verification-id',
          confirm: async (code: string) => {
            if (code === '123456') {
              return Promise.resolve();
            }
            throw new Error('Invalid verification code');
          }
        };
      }

      // Clear any existing reCAPTCHA
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        delete (window as any).recaptchaVerifier;
      }

      console.log('Setting up reCAPTCHA for phone:', phoneNumber);
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => console.log('reCAPTCHA verified:', response),
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          delete (window as any).recaptchaVerifier;
        }
      });

      (window as any).recaptchaVerifier = verifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      console.log('Verification code sent successfully');
      return confirmationResult;
    } catch (error: any) {
      console.error('Phone verification error:', error);
      throw new Error(error.message || 'Failed to send verification code');
    }
  };  const verifyPhoneCode = async (verificationId: string, code: string, phoneNumber?: string): Promise<void> => {
    try {
      if (isDevelopment) {
        if (!phoneNumber) {
          throw new Error('Phone number is required');
        }
        if (code !== '123456') {
          console.error('Invalid code in development mode:', code);
          throw new Error('Invalid verification code');
        }
        
        console.log('Development mode: Verifying user with phone:', phoneNumber);
        
        // Generate a consistent mock UID for development
        const mockUid = `dev-${phoneNumber.replace(/[^0-9]/g, '')}`;
        
        // Create a mock user
        const mockUser = {
          uid: mockUid,
          phoneNumber: phoneNumber,
          email: null,
          emailVerified: false,
          isAnonymous: false,
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          },
          providerData: [{
            providerId: 'phone',
            phoneNumber: phoneNumber,
            uid: phoneNumber,
            displayName: null,
            email: null,
            photoURL: null
          }],
          refreshToken: 'mock-refresh-token',
          tenantId: null,
          displayName: null,
          photoURL: null,
          delete: () => Promise.resolve(),
          getIdToken: () => Promise.resolve('mock-token'),
          getIdTokenResult: () => Promise.resolve({ 
            token: 'mock-token',
            authTime: new Date().toISOString(),
            issuedAtTime: new Date().toISOString(),
            expirationTime: new Date(Date.now() + 3600000).toISOString(),
            signInProvider: 'phone',
            claims: {}
          }),
          reload: () => Promise.resolve(),
          toJSON: () => ({
            uid: mockUid,
            phoneNumber: phoneNumber,
            providerData: [{
              providerId: 'phone',
              phoneNumber: phoneNumber
            }]
          })
        } as unknown as User;

        // Store user data in mock database
        await createUserDocument(mockUid, {
          phoneNumber: phoneNumber,
          authProvider: 'phone',
          createdAt: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        });

        // Update registered phones list
        const storedPhones = JSON.parse(localStorage.getItem('registeredPhones') || '[]');
        if (!storedPhones.includes(phoneNumber)) {
          storedPhones.push(phoneNumber);
          localStorage.setItem('registeredPhones', JSON.stringify(storedPhones));
        }

        // Set current user and store in localStorage
        setCurrentUser(mockUser);
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        console.log('Development mode: User verified and stored:', mockUser);
        return;
      }

      // Production mode
      console.log('Verifying code:', verificationId, code);
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(auth, credential);
      
      // Store or update the user data in Firestore (only in production)
      if (!isDevelopment) {
        await createUserDocument(result.user.uid, {
          phoneNumber: result.user.phoneNumber,
          authProvider: 'phone',
          lastSignInTime: new Date().toISOString()
        });
      }
      
      console.log('Phone verification successful:', result.user.phoneNumber);
      setCurrentUser(result.user);
    } catch (error: any) {
      console.error('Code verification error:', error);
      throw new Error(error.message || 'Failed to verify code');
    } finally {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        delete (window as any).recaptchaVerifier;
      }
    }
  };

  const value: AuthContextType = {
    currentUser,
    signUp,
    signIn,
    logout,
    sendPhoneVerification,
    verifyPhoneCode,
    checkExistingPhone
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
