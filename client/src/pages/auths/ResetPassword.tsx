import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertCircle, Loader, CheckCircle, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useValidateResetTokenQuery, useResetPasswordMutation } from '@/features/auth/authApi';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();
    
    const { data: tokenData, isLoading: isValidating, isError: isTokenInvalid } = 
      useValidateResetTokenQuery(token || '', { skip: !token });
    
    const [resetPassword, { isLoading }] = useResetPasswordMutation();
  
    const validatePassword = () => {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match');
        return false;
      }
      
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long');
        return false;
      }
      
      return true;
    };
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErrorMessage('');
      
      if (!validatePassword()) {
        return;
      }
      
      if (!token) {
        setErrorMessage('Reset token is missing');
        return;
      }

      try {
        const response = await resetPassword({
          reset_token: token,
          new_password: password
        });
        
        if ('data' in response && response.data && response.data.status === 'success') {
          setIsSuccess(true);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (err: any) {
        setErrorMessage(
          err.data?.message || 'Failed to reset password. Please try again.'
        );
      }
    };
  
    if (isValidating) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md shadow-lg p-8">
            <div className="flex flex-col items-center">
              <Loader className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Validating reset token...</p>
            </div>
          </Card>
        </div>
      );
    }
  
    if (isTokenInvalid || (tokenData && tokenData?.status !== 'success')) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-red-600">
                Invalid or Expired Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Reset Link</AlertTitle>
                <AlertDescription>
                  This password reset link is invalid or has expired. Please request a new one.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="justify-center">
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full"
              >
                Request New Reset Link
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
  
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <Alert className="mb-4 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Password Reset</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your password has been reset successfully. Redirecting to login...
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {errorMessage && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Resetting password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  export default ResetPasswordPage;