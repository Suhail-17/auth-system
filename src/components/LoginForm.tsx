import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const LoginForm = () => {
  const { signIn, sendPhoneVerification, verifyPhoneCode, checkExistingPhone } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    otp: ''
  });

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Clean up reCAPTCHA when component unmounts
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        delete (window as any).recaptchaVerifier;
      }
    };
  }, []);

  // Clean up reCAPTCHA when switching login types
  useEffect(() => {
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      delete (window as any).recaptchaVerifier;
    }
    setIsVerificationSent(false);
    setVerificationId('');
    setFormData(prev => ({ ...prev, otp: '' }));
  }, [loginType]);

  const validatePhoneNumber = (phone: string) => {
    // Indian phone number validation (10 digits after +91)
    const indianPhoneRegex = /^\+91[1-9]\d{9}$/;
    return indianPhoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters except '+'
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it starts with just numbers, add +91
    if (!cleaned.startsWith('+')) {
      cleaned = '+91' + cleaned;
    } else if (!cleaned.startsWith('+91')) {
      // If it starts with + but not +91, add 91 after +
      cleaned = '+91' + cleaned.substring(1);
    }
    
    return cleaned;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') {
      // Format phone number as user types
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedPhone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both email and password"
      });
      return;
    }

    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password);
      toast({
        title: "Success",
        description: "Signed in successfully"
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign in"
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.phone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your phone number"
      });
      return;
    }

    const phoneNumber = formData.phone;
    
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid 10-digit Indian phone number with country code (+91)"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isDevelopment) {
        // In development mode, check localStorage for registered phones
        const registeredPhones = JSON.parse(localStorage.getItem('registeredPhones') || '[]');
        console.log('Development mode: Checking registered phones for login:', registeredPhones);
        console.log('Attempting to login with phone:', phoneNumber);
        
        if (!registeredPhones.includes(phoneNumber)) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "This phone number is not registered. Please sign up first."
          });
          setIsLoading(false);
          return;
        }

        // If phone number exists, proceed with OTP
        setVerificationId('test-verification-id');
        setIsVerificationSent(true);
        toast({
          title: "Development Mode",
          description: "Use code '123456' for testing"
        });
      } else {
        // Production mode
        const confirmation = await sendPhoneVerification(phoneNumber, false);
        setVerificationId(confirmation.verificationId);
        setIsVerificationSent(true);
        toast({
          title: "Success",
          description: "Verification code sent to your phone"
        });
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification code"
      });
      setIsVerificationSent(false);
      setVerificationId('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp || !verificationId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the verification code"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isDevelopment) {
        const registeredPhones = JSON.parse(localStorage.getItem('registeredPhones') || '[]');
        
        // Double-check that the phone number is still registered
        if (!registeredPhones.includes(formData.phone)) {
          throw new Error('This phone number is not registered. Please sign up first.');
        }

        // Verify the OTP
        if (formData.otp !== '123456') {
          throw new Error('Invalid verification code');
        }
      }

      await verifyPhoneCode(verificationId, formData.otp, formData.phone);
      toast({
        title: "Success",
        description: "Signed in successfully"
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to verify code'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={loginType} onValueChange={setLoginType} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-200 transform hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone" className="space-y-4">
              <form onSubmit={handleMobileLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91XXXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isLoading || isVerificationSent}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Format: +91 followed by your 10-digit phone number
                  </p>
                </div>

                {isVerificationSent && (
                  <div className="space-y-2">
                    <Label htmlFor="otp">OTP Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={formData.otp}
                      onChange={(e) => handleInputChange('otp', e.target.value)}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-center text-lg tracking-widest"
                      maxLength={6}
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div id="recaptcha-container" />

                {!isVerificationSent ? (
                  <Button
                    type="button"
                    onClick={handleSendOTP}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-200 transform hover:scale-105"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-200 transform hover:scale-105"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsVerificationSent(false);
                        setVerificationId('');
                        setFormData(prev => ({ ...prev, otp: '' }));
                      }}
                      className="w-full mt-2 h-12"
                      disabled={isLoading}
                    >
                      Change Phone Number
                    </Button>
                  </>
                )}
              </form>
            </TabsContent>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Create an account
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our{' '}
                <a href="#" className="underline hover:text-primary">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="underline hover:text-primary">Privacy Policy</a>
              </p>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
