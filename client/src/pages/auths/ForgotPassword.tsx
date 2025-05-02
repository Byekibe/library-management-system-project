import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useForgotPasswordMutation } from '@/features/auth/authApi';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
    const navigate = useNavigate();
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErrorMessage('');
      
      try {
        const response = await forgotPassword({ email });
        if ('data' in response && response.data && 'status' in response.data && response.data.status === 'success') {
          setIsSubmitted(true);
        }
      } catch (err) {
        setErrorMessage(
          (err as { data?: { message?: string } })?.data?.message || 'Failed to send reset email. Please try again.'
        );
      }
    };
  
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <Alert className="mb-4 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Email Sent</AlertTitle>
                <AlertDescription className="text-green-700">
                  If an account exists with that email, you'll receive a password
                  reset link shortly.
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
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Sending email...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Button
              variant="link"
              className="px-0"
              onClick={() => navigate('/login')}
            >
              Back to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  export default ForgotPasswordPage;