import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getUserDocument } from '@/lib/db';

interface UserData {
  email?: string | null;
  phoneNumber?: string | null;
  authProvider?: string;
  createdAt?: string;
  lastSignInTime?: string;
  emailVerified?: boolean;
}

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const fetchUserData = async () => {
      try {
        const data = await getUserDocument(currentUser.uid);
        setUserData(data as UserData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user data"
        });
      }
    };

    fetchUserData();
  }, [currentUser, navigate, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out"
      });
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to Your Dashboard
            </CardTitle>
            <CardDescription className="text-gray-600">
              You are signed in as {currentUser.email || currentUser.phoneNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">ID:</span> {currentUser.uid}
                    </p>
                    {currentUser.email && (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Email:</span> {currentUser.email}
                      </p>
                    )}
                    {currentUser.phoneNumber && (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Phone:</span> {currentUser.phoneNumber}
                      </p>
                    )}
                    {userData?.authProvider && (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Auth Method:</span>{" "}
                        {userData.authProvider}
                      </p>
                    )}
                    {userData?.createdAt && (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Account Created:</span>{" "}
                        {new Date(userData.createdAt).toLocaleString()}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Email Verified:</span>{" "}
                      {currentUser.emailVerified ? "Yes" : "No"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/profile')}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
