import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const SignInForm = () => {
  const { signIn, sendPhoneVerification, verifyPhoneCode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [signInType, setSignInType] = useState('email');
  const [verificationId, setVerificationId] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    otp: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
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
      console.log('Attempting to sign in with:', formData.email);
      await signIn(formData.email, formData.password);
      toast({
        title: "Success",
        description: "Signed in successfully"
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign in"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.phone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your phone number"
      });
      return;
    }

    setIsLoading(true);
    try {
      const phoneNumber = formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`;
      console.log('Attempting to send verification code to:', phoneNumber);
      const confirmation = await sendPhoneVerification(phoneNumber);
      setVerificationId(confirmation.verificationId);
      setIsVerificationSent(true);
      toast({
        title: "Success",
        description: "Verification code sent to your phone"
      });
    } catch (error: any) {
      console.error('Phone verification error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification code"
      });
      setIsVerificationSent(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.otp) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the verification code"
      });
      return;
    }

    if (!verificationId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please request a verification code first"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to verify code:', formData.otp);
      await verifyPhoneCode(verificationId, formData.otp);
      toast({
        title: "Success",
        description: "Phone number verified successfully"
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Code verification error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to verify code"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sign In
            </CardTitle>
            <CardDescription className="text-gray-600">
              Welcome back! Please sign in to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={signInType} onValueChange={setSignInType} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
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
                        className="pl-10 h-12"
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
                        className="pl-10 pr-10 h-12"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In with Email"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4">
                <form onSubmit={isVerificationSent ? handleVerifyCode : handlePhoneSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-10 h-12"
                        required
                        disabled={isLoading || isVerificationSent}
                      />
                    </div>
                  </div>

                  {isVerificationSent && (
                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter verification code"
                        value={formData.otp}
                        onChange={(e) => handleInputChange('otp', e.target.value)}
                        className="h-12"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <div id="recaptcha-container" />

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isVerificationSent ? "Verifying..." : "Sending code..."}
                      </>
                    ) : (
                      isVerificationSent ? "Verify Code" : "Send Verification Code"
                    )}
                  </Button>

                  {isVerificationSent && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        setIsVerificationSent(false);
                        setVerificationId('');
                        setFormData(prev => ({ ...prev, otp: '' }));
                      }}
                    >
                      Try Different Phone Number
                    </Button>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignInForm;
