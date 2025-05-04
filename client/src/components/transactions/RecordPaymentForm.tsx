import React, { useState, FormEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
// import { skipToken } from '@reduxjs/toolkit/query/react';
import { useGetMembersQuery, useRecordPaymentMutation } from '@/features/member/memberApi';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  CreditCard, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  User, 
  TrendingDown, 
  TrendingUp 
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const RecordPaymentForm: React.FC = () => {
  // Get the memberId from the URL parameters
  const { memberId: memberIdParam } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  // Convert the URL parameter string to a number
  const memberId = memberIdParam ? parseInt(memberIdParam, 10) : null;

  // State for the payment amount input
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  // State for form-specific feedback messages
  const [formFeedback, setFormFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Fetch member details
  const { data: members, error: membersError, isLoading: membersLoading } = useGetMembersQuery();
  const member = members?.find(m => m.id === memberId);

  // Use RTK Query mutation hook for recording payment
  const [recordPayment, {
    isLoading: isRecording,
    isSuccess: isRecordSuccess,
    isError: isRecordError,
    error: recordError,
    data: recordSuccessData,
    reset
  }] = useRecordPaymentMutation();

  // Effect to show feedback from mutation state
  useEffect(() => {
    if (isRecordSuccess) {
      setFormFeedback({ 
        message: recordSuccessData?.message || 'Payment recorded successfully!', 
        type: 'success' 
      });
      setPaymentAmount(''); // Clear the input on success
      // Optional: Navigate back or to member details after success
      // const timer = setTimeout(() => navigate(`/members/${memberId}`), 2000);
      // return () => clearTimeout(timer);
    } else if (isRecordError) {
      const errorMessage = (recordError as any)?.data?.message || 
                          (recordError as any)?.message || 
                          'Failed to record payment.';
      setFormFeedback({ message: `Error: ${errorMessage}`, type: 'error' });
    } else {
      setFormFeedback(null); // Clear feedback when not in success or error state
    }
    
    // Clean up feedback state when component unmounts or mutation state changes significantly
    return () => {
      if (isRecordSuccess || isRecordError) {
        reset(); // Reset mutation state after showing feedback
      }
    };
  }, [isRecordSuccess, isRecordError, recordSuccessData, recordError, reset, memberId, navigate]);

  // Handle form submission
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormFeedback(null); // Clear previous feedback

    // Basic client-side validation
    if (paymentAmount === '' || paymentAmount <= 0 || memberId === null || isNaN(memberId)) {
      setFormFeedback({ 
        message: 'Please enter a valid positive payment amount and ensure member ID is valid.', 
        type: 'error' 
      });
      return;
    }

    const paymentRequest = {
      memberId: memberId,
      amount: Number(paymentAmount),
    };

    try {
      // Trigger the mutation
      await recordPayment(paymentRequest);
      // Success/Error handling is now primarily in the useEffect
    } catch (err) {
      // Error is handled by the mutation state/error and the useEffect
      console.error('Caught error during recordPayment mutation:', err);
    }
  };

  // Handle back button click
  const handleBack = () => {
    navigate(`/members/${memberId}`);
  };

  // Display error if memberId is invalid
  if (memberId === null || isNaN(memberId)) {
    return (
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p>Invalid Member ID provided in the URL.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/members')} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Members
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Display loading state for fetching member details
  if (membersLoading) {
    return (
      <Card className="max-w-md mx-auto shadow-lg">
        <CardContent className="pt-6 flex justify-center items-center flex-col space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p>Loading member details...</p>
        </CardContent>
      </Card>
    );
  }

  // Display error if there was an error loading members
  if (membersError) {
    return (
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p>Error loading member details.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/members')} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Members
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Display error if member is not found after loading
  if (!member) {
    return (
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p>Member not found.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/members')} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Members
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Determine how to display the debt/balance
  const outstandingDebt = Number(member.outstanding_debt);
  const formattedDebt = outstandingDebt.toFixed(2);
  const isCredit = outstandingDebt < 0;
  const debtAmount = isCredit ? Math.abs(outstandingDebt).toFixed(2) : formattedDebt;
  const debtLabel = isCredit ? 'Credit Balance' : 'Outstanding Debt';

  return (
    <Card className="max-w-md mx-auto shadow-lg">
      <CardHeader className="bg-gray-50">
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack} 
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl font-semibold">Record Payment</CardTitle>
          <div className="w-8"></div> {/* Empty div for spacing */}
        </div>
        <CardDescription className="flex items-center justify-center mt-4">
          <div className="flex items-center bg-gray-100 p-2 rounded-full mr-2">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <span className="font-medium text-base">{member.name}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Current Status</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`flex items-center px-3 py-1 rounded-full text-sm ${
                      isCredit ? 'bg-green-100 text-green-700' : outstandingDebt > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isCredit ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : outstandingDebt > 0 ? (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    ) : null}
                    {debtLabel}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isCredit ? 'Member has a credit balance' : 'Member owes this amount'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className={`text-2xl font-bold mt-2 ${
            isCredit ? 'text-green-600' : outstandingDebt > 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            KES {debtAmount}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-amount" className="text-sm font-medium">
              Payment Amount (KES)
            </Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                className="pl-10"
                placeholder="Enter amount"
                disabled={isRecording}
                required
              />
            </div>
          </div>

          {formFeedback && (
            <Alert variant={formFeedback.type === 'success' ? 'default' : 'destructive'}>
              {formFeedback.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {formFeedback.type === 'success' ? 'Success' : 'Error'}
              </AlertTitle>
              <AlertDescription>
                {formFeedback.message}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isRecording || paymentAmount === '' || paymentAmount <= 0}
          >
            {isRecording ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" /> Record Payment
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecordPaymentForm;