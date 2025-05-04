import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCreateMemberMutation } from '@/features/member/memberApi';
import { CreateMemberRequest } from '@/types/memberTypes';
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
  UserPlus, 
  Mail, 
  Phone, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  User
} from 'lucide-react';
import { Label } from '@/components/ui/label';

const CreateMember = () => {
  const navigate = useNavigate();

  // RTK Query mutation hook
  const [createMember, { isLoading, isError, isSuccess, error }] = useCreateMemberMutation();

  // Form feedback state
  const [formFeedback, setFormFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // State for form data
  const [formData, setFormData] = useState<CreateMemberRequest>({
    name: '',
    email: '',
    phone: '',
  });

  // Handle successful creation
  useEffect(() => {
    if (isSuccess) {
      setFormFeedback({
        message: 'Member created successfully!',
        type: 'success'
      });
      
      // Automatically navigate after success with a delay
      const timer = setTimeout(() => {
        navigate('/members');
      }, 2000);
      
      return () => clearTimeout(timer);
    } else if (isError) {
      const errorMessage = (error as any)?.data?.message || 
                          (error as any)?.message || 
                          'Failed to create member.';
      setFormFeedback({
        message: `Error: ${errorMessage}`,
        type: 'error'
      });
    }
  }, [isSuccess, isError, error, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Clear previous feedback
    setFormFeedback(null);
    
    // Basic validation: name is required
    if (!formData.name.trim()) {
      setFormFeedback({
        message: 'Name is required.',
        type: 'error'
      });
      return;
    }

    try {
      // Attempt to create the member
      const newMember = await createMember(formData).unwrap();
      console.log('Created Member:', newMember);
      // Success handling happens in the useEffect
    } catch (err) {
      console.error('Failed to create member:', err);
      // Error handling happens in the useEffect
    }
  };

  const handleBack = () => {
    navigate('/members');
  };

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
          <CardTitle className="text-xl font-semibold">Add New Member</CardTitle>
          <div className="w-8"></div> {/* Empty div for spacing */}
        </div>
        <CardDescription className="flex items-center justify-center mt-4">
          <div className="flex items-center bg-gray-100 p-2 rounded-full mr-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
          </div>
          <span>Create a new member profile</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-500" />
            <span>Name <span className="text-red-500">*</span></span>
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            className="focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center">
            <Mail className="h-4 w-4 mr-2 text-gray-500" />
            <span>Email (Optional)</span>
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            placeholder="Enter email address"
            className="focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-500" />
            <span>Phone (Optional)</span>
          </Label>
          <Input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            placeholder="Enter phone number"
            className="focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        {formFeedback && (
          <Alert variant={formFeedback.type === 'success' ? 'default' : 'destructive'} className="mt-4">
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
      </CardContent>

      <CardFooter className="flex flex-col">
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !formData.name.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Create Member
            </>
          )}
        </Button>
        
        {isSuccess && (
          <p className="text-sm text-center text-gray-500 mt-2">
            Redirecting to members list...
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default CreateMember;