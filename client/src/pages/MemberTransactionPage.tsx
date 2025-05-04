// src/pages/MemberTransactionHistoryPage.tsx
import React from 'react';
import { useParams } from 'react-router'; // Import useParams
import { skipToken } from '@reduxjs/toolkit/query/react'; // Import skipToken
import { useGetTransactionsByMemberQuery } from '@/features/transaction/transactionApi'; // Adjust the import path if needed
import { useGetBooksQuery } from '@/features/book/bookApi'; // Assuming you have this hook
import { useGetMembersQuery } from '@/features/member/memberApi'; // Assuming you have this hook
// No need to import Transaction type here unless you use it directly in component logic

const MemberTransactionHistoryPage: React.FC = () => {
  // Get the memberId from the URL parameters
  const { memberId: memberIdParam } = useParams<{ memberId: string }>();

  // Convert the URL parameter string to a number
  const memberId = memberIdParam ? parseInt(memberIdParam, 10) : null;

  // RTK Query hook to fetch transactions for the specific member
  // Use skipToken if memberId is null or not a valid number
  const {
    data: transactions,
    error: transactionsError,
    isLoading: transactionsLoading,
    isFetching: transactionsFetching
  } = useGetTransactionsByMemberQuery(memberId !== null && !isNaN(memberId) ? memberId : skipToken);

  // RTK Query hooks to fetch data needed for lookup (titles, names)
  // These queries can run regardless of memberId, RTK Query caches them
  const { data: books, error: booksError, isLoading: booksLoading } = useGetBooksQuery();
  const { data: members, error: membersError, isLoading: membersLoading } = useGetMembersQuery();

  // Find the member data for the heading
  const member = members?.find(m => m.id === memberId);
  const memberName = member ? member.name : `ID: ${memberIdParam}`; // Display name or ID if not found

  // Helper function to find book title by ID (same as TransactionHistoryTable)
  const getBookTitle = (bookId: number): string => {
    if (!books) return `Book ID: ${bookId}`;
    const book = books.find(b => b.id === bookId);
    return book ? `${book.title} by ${book.author}` : `Book ID: ${bookId}`;
  };

  // Helper function to find member name by ID (same as TransactionHistoryTable, but less needed here as we know the member)
  // Keeping it for consistency if needed elsewhere, but not strictly used for the main heading
  // const getMemberName = (memberId: number): string => {
  //    if (!members) return `Member ID: ${memberId}`;
  //   const memberFound = members.find(m => m.id === memberId);
  //   return memberFound ? memberFound.name : `Member ID: ${memberId}`;
  // };


  // Helper function to format date strings (same as TransactionHistoryTable)
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString();
    } catch (e) {
        console.error("Failed to parse date:", dateString, e);
        return dateString;
    }
  };

  // Determine overall loading state
  const overallLoading = transactionsLoading || transactionsFetching || booksLoading || membersLoading;
  // Determine overall error state
  const overallError = transactionsError || booksError || membersError || (memberId === null || isNaN(memberId)); // Also consider invalid memberId from URL

  // Display error if memberId is invalid
  if (memberId === null || isNaN(memberId)) {
      return (
          <div className="p-6 bg-white rounded-lg shadow-md max-w-full mx-auto text-red-600">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Error</h2>
              <p>Invalid Member ID provided in the URL.</p>
          </div>
      );
  }


  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-full mx-auto">
      {/* Dynamic Heading */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Transaction History for {memberName}
      </h2>

      {/* Loading State */}
      {overallLoading && <p className="text-gray-500">Loading transactions...</p>}

      {/* Error State */}
      {overallError && !overallLoading && ( // Only show error if not loading
        <p className="text-red-600">Error loading transaction data. Please try again.</p>
        // You might want to display more specific error details here
      )}

      {/* Empty State */}
      {!overallLoading && !overallError && transactions && transactions.length === 0 && (
        <p className="text-gray-500">No transactions recorded for this member yet.</p>
      )}

      {/* Transaction Table */}
      {!overallLoading && !overallError && transactions && transactions.length > 0 && (
        <div className="overflow-x-auto"> {/* Add overflow for smaller screens */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                {/* Member column is not needed as the page is specific to one member */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Charged (KES)
                </th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getBookTitle(transaction.book_id)}
                  </td>
                   {/* Member cell is removed */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.issue_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.return_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {Number(transaction.fee_charged).toFixed(2)}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MemberTransactionHistoryPage;
