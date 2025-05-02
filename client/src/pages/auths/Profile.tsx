import { useNavigate } from 'react-router';
import { useAuth, useLogout } from '@/features/auth/authHooks';
import { Key, Loader, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const ProfilePage = () => {
    const { user } = useAuth();
    const { logout } = useLogout();
    const navigate = useNavigate();
  
    const handleLogout = async () => {
      await logout();
      navigate('/login');
    };
  
    if (!user) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">Account Profile</CardTitle>
              <Button 
                variant="outline" 
                className="flex items-center" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
            <CardDescription>
              Manage your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-center flex-col sm:flex-row sm:justify-start gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-medium">{user.username}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-sm font-medium text-gray-500">
                      Username
                    </Label>
                    <div className="mt-1">
                      <Input id="username" value={user.username} disabled />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-500">
                      Email
                    </Label>
                    <div className="mt-1">
                      <Input id="email" value={user.email} disabled />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="created" className="text-sm font-medium text-gray-500">
                      Member Since
                    </Label>
                    <div className="mt-1">
                      <Input 
                        id="created" 
                        value={new Date(user.created_at).toLocaleDateString()} 
                        disabled 
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-gray-500">
                      Account Status
                    </Label>
                    <div className="mt-1">
                      <Input id="status" value={user.is_active ? 'Active' : 'Inactive'} disabled />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Account Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => navigate('/change-password')} className="flex items-center justify-center">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  export default ProfilePage;