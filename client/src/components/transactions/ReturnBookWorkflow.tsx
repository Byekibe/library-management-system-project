import { useState, useEffect } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetMembersQuery } from '@/features/member/memberApi';
import { useGetBooksQuery } from '@/features/book/bookApi';
import { useGetOpenTransactionsByMemberQuery, useReturnBookMutation } from '@/features/transaction/transactionApi';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Alert, 
  AlertDescription 
} from '@/components/ui/alert';
import { 
  BookOpen, 
  Calendar, 
  User, 
  BookX, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  ArrowDownCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const ReturnBookWorkflow = () => {
  // State to hold the selected Member ID
  const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
  
  // RTK Query hooks to fetch data
  const { 
    data: members, 
    error: membersError, 
    isLoading: membersLoading 
  } = useGetMembersQuery();
  
  const { data: books } = useGetBooksQuery();

  // RTK Query hook to get open transactions for the selected member
  const {
    data: openTransactions,
    error: openTransactionsError,
    isLoading: openTransactionsLoading,
    isFetching: openTransactionsFetching
  } = useGetOpenTransactionsByMemberQuery(
    selectedMemberId !== '' ? selectedMemberId : skipToken, 
    { skip: selectedMemberId === '' }
  );

  // RTK Query hook for the return mutation
  const [returnBook, { isLoading: isReturning }] = useReturnBookMutation();

  // State to manage feedback message for the return action
  const [returnFeedback, setReturnFeedback] = useState<{ 
    message: string, 
    type: 'success' | 'error' 
  } | null>(null);

  // Effect to clear return feedback after a few seconds
  useEffect(() => {
    if (returnFeedback) {
      const timer = setTimeout(() => {
        setReturnFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [returnFeedback]);

  // Handle return button click
  const handleReturn = async (transactionId: number) => {
    setReturnFeedback(null);
    try {
      const result = await returnBook(transactionId).unwrap();
      setReturnFeedback({ 
        message: result.message || 'Book returned successfully.', 
        type: 'success' 
      });
    } catch (err) {
      const errorMessage = (err as any)?.data?.message || 
                          (err as any)?.message || 
                          'Failed to return book.';
      setReturnFeedback({ message: errorMessage, type: 'error' });
      console.error('Failed to return book:', err);
    }
  };

  // Helper function to find book title by ID
  const getBookTitle = (bookId: number): string => {
    if (!books) return `Book ID: ${bookId}`;
    const book = books.find(b => b.id === bookId);
    return book ? `${book.title} by ${book.author}` : `Book ID: ${bookId}`;
  };

  // Helper function to format date strings
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.error("Failed to parse date:", dateString, e);
      return dateString;
    }
  };

  // Calculate days overdue for a transaction
  const getDaysOverdue = (issueDate: string | null): number => {
    if (!issueDate) return 0;
    try {
      const issued = new Date(issueDate);
      const today = new Date();
      const dueDate = new Date(issued);
      dueDate.setDate(dueDate.getDate() + 14); // Assuming 14-day lending period
      
      if (today <= dueDate) return 0;
      
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Failed to calculate days overdue:", e);
      return 0;
    }
  };

  // Get status badge for a transaction
  const getStatusBadge = (transaction: any) => {
    if (!transaction.issue_date) return null;
    
    const daysOverdue = getDaysOverdue(transaction.issue_date);
    
    if (daysOverdue > 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>{daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue</span>
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
        <CheckCircle className="w-3 h-3 text-green-500" />
        <span className="text-green-700">Active</span>
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <CardTitle className="text-xl">Return Book</CardTitle>
          </div>
          <CardDescription className="text-blue-100">
            Process book returns and clear member records
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Member Selection */}
          <div className="mb-6 space-y-2">
            <label htmlFor="member-select" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              Select Member
            </label>
            
            {membersLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : membersError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading members. Please try again.
                </AlertDescription>
              </Alert>
            ) : (
              <Select
                value={selectedMemberId.toString()}
                onValueChange={(value) => setSelectedMemberId(Number(value) || '')}
                disabled={membersLoading || !members?.length || isReturning}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Select a Member --" />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      <div className="flex justify-between items-center w-full">
                        <span>{member.name}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full ml-2">
                          Debt: KES {Number(member.outstanding_debt)?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Issued Books Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <BookX className="h-5 w-5 text-indigo-600" />
                Issued Books
              </h3>
              
              {(openTransactionsLoading || openTransactionsFetching) && (
                <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>

            {!selectedMemberId && (
              <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <ArrowDownCircle className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-gray-500">Select a member to see their issued books</p>
              </div>
            )}

            {selectedMemberId !== '' && (openTransactionsLoading || openTransactionsFetching) && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            )}

            {selectedMemberId !== '' && openTransactionsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading issued books. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {selectedMemberId !== '' && 
             !openTransactionsLoading && 
             !openTransactionsFetching && 
             openTransactions && 
             openTransactions.length === 0 && (
              <div className="py-10 text-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">This member currently has no books issued.</p>
              </div>
            )}

            {selectedMemberId !== '' && 
             openTransactions && 
             openTransactions.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium">Book Title</TableHead>
                      <TableHead className="font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Issue Date
                        </div>
                      </TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="text-right font-medium">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{getBookTitle(transaction.book_id)}</TableCell>
                        <TableCell>{formatDate(transaction.issue_date)}</TableCell>
                        <TableCell>{getStatusBadge(transaction)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            onClick={() => handleReturn(transaction.id)}
                            disabled={isReturning}
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isReturning ? (
                              <>
                                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                Processing...
                              </>
                            ) : 'Return'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>

        {/* Return Feedback Message */}
        {returnFeedback && (
          <CardFooter className="border-t px-6 py-4">
            <Alert 
              variant={returnFeedback.type === 'success' ? 'default' : 'destructive'}
              className={`w-full ${returnFeedback.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : ''}`}
            >
              {returnFeedback.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{returnFeedback.message}</AlertDescription>
            </Alert>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ReturnBookWorkflow;