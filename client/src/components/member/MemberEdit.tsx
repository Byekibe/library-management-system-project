// src/components/MemberEdit.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGetMemberQuery, useUpdateMemberMutation } from '@/features/member/memberApi';
import { Loader2, ArrowLeft, Save, User } from 'lucide-react';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from "sonner"

// Note: Since you mentioned you use shadcn/ui, I'm using their form components which work well with react-hook-form
// If you don't have react-hook-form or zod set up, you'll need to add them to your project

// Define the validation schema for the form
const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal(''))
});

// Define the form data type from the schema
type FormData = z.infer<typeof formSchema>;

const MemberEdit: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const id = memberId ? parseInt(memberId, 10) : undefined;
  const navigate = useNavigate();

  // Create form instance with validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // Fetch existing member data
  const { 
    data: member, 
    isLoading: fetchLoading, 
    // error: fetchError,
    isError: isFetchError
  } = useGetMemberQuery(id!, {
    skip: id === undefined,
  });

  // Update mutation
  const [updateMember, { 
    isLoading: updateLoading, 
    isSuccess: updateSuccess,
    isError: isUpdateError,
    error: updateError
  }] = useUpdateMemberMutation();

  // Set form values when member data is loaded
  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email || '',
        phone: member.phone || '',
      });
    }
  }, [member, form]);

  // Handle successful update
  useEffect(() => {
    if (updateSuccess) {
      toast("Member information has been successfully updated.");
      navigate(`/members/${id}`);
    }
  }, [updateSuccess, id, navigate, toast]);

  // Handle update errors
  useEffect(() => {
    if (isUpdateError && updateError) {
      toast("There was a problem updating the member information.")
    }
  }, [isUpdateError, updateError, toast]);

  const onSubmit = async (formData: FormData) => {
    if (id === undefined) return;
    
    try {
      await updateMember({ id, member: formData }).unwrap();
    } catch (err) {
      console.error('Failed to update member:', err);
    }
  };

  const handleCancel = () => {
    navigate(`/members/${id}`);
  };

  // Handle different states
  if (id === undefined) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="bg-red-50 border-b border-red-100">
          <CardTitle className="text-red-700">Invalid Request</CardTitle>
          <CardDescription className="text-red-600">
            No member ID was provided for editing.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end pt-6">
          <Button variant="outline" onClick={() => navigate('/members')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading member data...</span>
      </div>
    );
  }

  if (isFetchError || !member) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="bg-red-50 border-b border-red-100">
          <CardTitle className="text-red-700">Error</CardTitle>
          <CardDescription className="text-red-600">
            {isFetchError ? 'Failed to load member data.' : 'Member not found.'}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end pt-6">
          <Button variant="outline" onClick={() => navigate('/members')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto mt-8 shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-primary" />
          <CardTitle className="text-2xl">Edit Member</CardTitle>
        </div>
        <CardDescription>
          Update information for {member.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The member's contact email address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={updateLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateLoading || !form.formState.isDirty}
                className="flex-1"
              >
                {updateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MemberEdit;