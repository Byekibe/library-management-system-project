import React, { useState, FormEvent } from 'react';
import { useIssueBookMutation } from '@/features/transaction/transactionApi';
import { useGetBooksQuery } from '@/features/book/bookApi';
import { useGetMembersQuery } from '@/features/member/memberApi';
import { IssueBookRequest } from '@/types/transactionType';
import { Link } from 'react-router';
import { 
  BookOpen, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  BookPlus,
  Loader2,
  CreditCard
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// Define the error structure expected from the backend
// interface DebtLimitError {
//   status: number;
//   data: {
//     message: string;
//   };
// }

const IssueBookForm = () => {
  // State for selected Book ID and Member ID
  const [selectedBookId, setSelectedBookId] = useState<number | ''>('');
  const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');

  // RTK Query hooks for data fetching
  const { 
    data: books, 
    error: booksError, 
    isLoading: booksLoading 
  } = useGetBooksQuery();
  
  const { 
    data: members, 
    error: membersError, 
    isLoading: membersLoading 
  } = useGetMembersQuery();

  // RTK Query hook for the issue book mutation
  const [
    issueBook, 
    { 
      isLoading: isIssuing, 
      isSuccess, 
      isError, 
      error, 
      data: successData 
    }
  ] = useIssueBookMutation();

  // Handle form submission
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Validate form inputs
    if (selectedBookId === '' || selectedMemberId === '') {
      return;
    }

    const issueRequest: IssueBookRequest = {
      book_id: Number(selectedBookId),
      member_id: Number(selectedMemberId),
    };

    try {
      // Trigger the mutation
      await issueBook(issueRequest).unwrap();
      // Reset form on success
      setSelectedBookId('');
      setSelectedMemberId('');
    } catch (err) {
      console.error('Failed to issue book:', err);
    }
  };

  // Get book data for the selected book (if any)
  const selectedBook = selectedBookId !== '' && books
    ? books.find(book => book.id === Number(selectedBookId))
    : null;

  // Get member data for the selected member (if any)
  const selectedMember = selectedMemberId !== '' && members
    ? members.find(member => member.id === Number(selectedMemberId))
    : null;

  // Handle feedback messages
  let feedbackContent: React.ReactNode = null;
  let feedbackVariant: 'default' | 'destructive' = 'default';

  if (isSuccess) {
    feedbackContent = (
      <>
        <AlertTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Success
        </AlertTitle>
        <AlertDescription>
          {successData?.message || 'Book issued successfully!'}
        </AlertDescription>
      </>
    );
  } else if (isError) {
    feedbackVariant = 'destructive';
    const err = error as any;
    const errorMessage = err?.data?.message || err?.message || 'Failed to issue book.';
    
    // Check if the error indicates debt limit exceeded
    const debtLimitMatch = errorMessage.match(/Member has outstanding debt \(KES ([\d,]+\.\d{2})\) exceeding limit/);
    
    if (debtLimitMatch && selectedMemberId !== '') {
      const outstandingDebt = debtLimitMatch[1];
      feedbackContent = (
        <>
          <AlertTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Payment Required
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Cannot issue book. Member has outstanding debt (KES {outstandingDebt}).</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 mt-2"
              asChild
            >
              <Link to={`/members/${selectedMemberId}/pay-debt`}>
                <CreditCard className="h-4 w-4" />
                Record Payment
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </AlertDescription>
        </>
      );
    } else {
      // Generic error message
      feedbackContent = (
        <>
          <AlertTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Error
          </AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </>
      );
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2">
            <BookPlus className="h-6 w-6" />
            <CardTitle className="text-xl">Issue Book</CardTitle>
          </div>
          <CardDescription className="text-blue-100">
            Assign a book to a library member
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Book Selection */}
            <div className="space-y-2">
              <label 
                htmlFor="book-select" 
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <BookOpen className="h-4 w-4 text-gray-600" />
                Select Book
              </label>
              
              {booksLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : booksError ? (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Error loading books.</AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedBookId.toString()}
                  onValueChange={(value) => setSelectedBookId(Number(value) || '')}
                  disabled={isIssuing || booksLoading || !books?.length}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Select a Book --" />
                  </SelectTrigger>
                  <SelectContent>
                    {books?.map((book) => (
                      <SelectItem 
                        key={book.id} 
                        value={book.id.toString()}
                        disabled={book.available_stock <= 0}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{book.title}</span>
                          <span className="text-xs text-gray-500">
                            by {book.author} • {book.available_stock} available
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Book Preview Card */}
              {selectedBook && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-100">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-blue-800">{selectedBook.title}</p>
                      <p className="text-sm text-blue-600">by {selectedBook.author}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full inline-block">
                        {selectedBook.available_stock} available
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Member Selection */}
            <div className="space-y-2">
              <label 
                htmlFor="member-select" 
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <User className="h-4 w-4 text-gray-600" />
                Select Member
              </label>
              
              {membersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : membersError ? (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Error loading members.</AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedMemberId.toString()}
                  onValueChange={(value) => setSelectedMemberId(Number(value) || '')}
                  disabled={isIssuing || membersLoading || !members?.length}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Select a Member --" />
                  </SelectTrigger>
                  <SelectContent>
                    {members?.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        <div className="flex justify-between items-center w-full">
                          <span>{member.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                            Number(member.outstanding_debt) > 0 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            Debt: KES {Number(member.outstanding_debt)?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Member Preview Card */}
              {selectedMember && (
                <div className="mt-2 p-3 bg-green-50 rounded-md border border-green-100">
                  <div className="flex justify-between">
                    <p className="font-medium text-green-800">{selectedMember.name}</p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                      Number(selectedMember.outstanding_debt) > 0 
                        ? 'bg-amber-200 text-amber-800' 
                        : 'bg-green-200 text-green-800'
                    }`}>
                      Debt: KES {Number(selectedMember.outstanding_debt)?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isIssuing || selectedBookId === '' || selectedMemberId === ''}
            >
              {isIssuing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  <BookPlus className="mr-2 h-4 w-4" />
                  Issue Book
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        {/* Feedback Message */}
        {feedbackContent && (
          <CardFooter className="border-t px-6 py-4">
            <Alert 
              variant={feedbackVariant}
              className={`w-full ${
                isSuccess ? 'bg-green-50 text-green-800 border-green-200' : ''
              }`}
            >
              {feedbackContent}
            </Alert>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default IssueBookForm;