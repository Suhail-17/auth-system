import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Phone, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const SignUpForm = () => {
  const { signUp, sendPhoneVerification, verifyPhoneCode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signUpType, setSignUpType] = useState('email');
  const [verificationId, setVerificationId] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    otp: ''
  });

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Clean up recaptcha when component unmounts
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        delete (window as any).recaptchaVerifier;
      }
    };
  }, []);

  const validatePhoneNumber = (phone: string) => {
    const indianPhoneRegex = /^\+91[1-9]\d{9}$/;
    return indianPhoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+91' + cleaned;
    } else if (!cleaned.startsWith('+91')) {
      cleaned = '+91' + cleaned.substring(1);
    }
    return cleaned;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') {
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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match"
      });
      return;
    }

    setIsLoading(true);
    try {
      await signUp(formData.email, formData.password);
      toast({
        title: "Success",
        description: "Account created successfully"
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your phone number"
      });
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
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
        // Check if phone number is already registered
        const registeredPhones = JSON.parse(localStorage.getItem('registeredPhones') || '[]');
        console.log('Development mode: Checking existing phones:', registeredPhones);
        
        if (registeredPhones.includes(formData.phone)) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "This phone number is already registered. Please sign in instead."
          });
          setIsLoading(false);
          return;
        }

        console.log('Development mode: Simulating OTP send to:', formData.phone);
        setVerificationId('test-verification-id');
        setIsVerificationSent(true);
        toast({
          title: "Development Mode",
          description: "Use code '123456' for testing"
        });
      } else {
        console.log('Sending verification code to:', formData.phone);
        const confirmation = await sendPhoneVerification(formData.phone, true);
        setVerificationId(confirmation.verificationId);
        setIsVerificationSent(true);
        toast({
          title: "Success",
          description: "Verification code sent to your phone"
        });
      }
    } catch (error: any) {
      console.error('Send verification error:', error);
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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the verification code"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save the phone number before verification
      console.log('Verifying code for phone:', formData.phone);
      await verifyPhoneCode('test-verification-id', formData.otp, formData.phone);

      // Manually store the phone number as registered in development mode
      if (isDevelopment) {
        const registeredPhones = JSON.parse(localStorage.getItem('registeredPhones') || '[]');
        if (!registeredPhones.includes(formData.phone)) {
          registeredPhones.push(formData.phone);
          localStorage.setItem('registeredPhones', JSON.stringify(registeredPhones));
          console.log('Development mode: Registered phones updated:', registeredPhones);
        }
      }

      toast({
        title: "Success",
        description: "Phone number verified successfully"
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Verification error:', error);
      let errorMessage = error.message;
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired. Please request a new one.';
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
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
            Create an Account
          </CardTitle>
          <CardDescription>
            Get started with your new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={signUpType} onValueChange={setSignUpType} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
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
                >
                  Create Account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              <form onSubmit={isVerificationSent ? handleVerifyCode : handleSendVerification} className="space-y-4">
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
                    <Label htmlFor="otp">Verification Code</Label>
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
                    type="submit"
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
                        "Verify & Sign Up"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        setIsVerificationSent(false);
                        setVerificationId('');
                        setFormData(prev => ({ ...prev, otp: '' }));
                      }}
                      disabled={isLoading}
                    >
                      Try Different Number
                    </Button>
                  </>
                )}
              </form>
            </TabsContent>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  to="/" 
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                By signing up, you agree to our{' '}
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

export default SignUpForm;
