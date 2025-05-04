// src/components/MemberOpenTransactions.tsx
import React from 'react';
import {
  useGetOpenTransactionsByMemberQuery,
  useReturnBookMutation,
} from '@/features/transaction/transactionApi'; // Adjust import path

interface MemberOpenTransactionsProps {
  memberId: number;
}

const MemberOpenTransactions: React.FC<MemberOpenTransactionsProps> = ({ memberId }) => {
  // Fetch open transactions for the member
  const { data: openTransactions, error, isLoading, isError } = useGetOpenTransactionsByMemberQuery(memberId);

  // Mutation hook for returning a book
  const [returnBook, { isLoading: isReturning, error: returnError }] = useReturnBookMutation();

  const handleReturnClick = async (transactionId: number) => {
    if (window.confirm('Are you sure you want to return this book?')) {
      try {
        await returnBook(transactionId).unwrap();
        // RTK Query automatically invalidates the cache based on your providesTags/invalidatesTags setup,
        // so the list should automatically refetch/update.
        console.log(`Transaction ${transactionId} returned successfully.`);
      } catch (err) {
        console.error('Failed to return book:', err);
        // Error state handled by isReturning/returnError
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading open transactions...</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-4 text-red-600">
        Error loading transactions: {error && 'status' in error ? `Error ${error.status}` : 'An unknown error occurred.'}
      </div>
    );
  }

  if (!openTransactions || openTransactions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-600">
        No open transactions found for this member.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Open Transactions for Member ID: {memberId}</h3>
      <ul className="space-y-4">
        {openTransactions.map((transaction) => (
          <li key={transaction.id} className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
            <div>
              <p className="text-lg font-medium text-gray-900">Transaction ID: {transaction.id}</p>
              <p className="text-sm text-gray-600">Book ID: {transaction.book_id}</p>
              <p className="text-sm text-gray-600">Issue Date: {new Date(transaction.issue_date).toLocaleDateString()}</p>
              {/* Displaying status or fee might be relevant here */}
              {/* <p className="text-sm text-gray-600">Status: {transaction.status}</p> */}
            </div>
            <button
              onClick={() => handleReturnClick(transaction.id)}
              className={`ml-4 py-2 px-4 rounded-md text-sm font-medium text-white ${
                isReturning ? 'bg-yellow-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500'
              }`}
              disabled={isReturning}
            >
              {isReturning ? 'Returning...' : 'Return Book'}
            </button>
          </li>
        ))}
      </ul>
        {returnError && (
            <p className="mt-4 text-red-600 text-sm text-center">
                Error returning book: {returnError && 'status' in returnError ? `Error ${returnError.status}` : 'An unknown error occurred.'}
            </p>
        )}
    </div>
  );
};

export default MemberOpenTransactions;