// src/pages/TransactionDashboardPage.tsx
import React, { useState } from 'react';
import { useGetMembersQuery, useGetMemberDebtQuery } from '@/features/member/memberApi';
import { useGetBooksQuery } from '@/features/book/bookApi';
import {
    useIssueBookMutation,
    useReturnBookMutation,
    useGetOpenTransactionsByMemberQuery,
} from '@/features/transaction/transactionApi';

const TransactionDashboardPage: React.FC = () => {
    // State for Issue Section
    const [selectedMemberIdForIssue, setSelectedMemberIdForIssue] = useState<number | null>(null);
    const [selectedBookIdForIssue, setSelectedBookIdForIssue] = useState<number | null>(null);
    const [issueFeedback, setIssueFeedback] = useState<string>('');

    // State for Return Section
    const [selectedMemberIdForReturn, setSelectedMemberIdForReturn] = useState<number | null>(null);
    const [returnFeedback, setReturnFeedback] = useState<string>('');

    // RTK Query Hooks
    const { data: members, isLoading: isLoadingMembers } = useGetMembersQuery();
    const { data: books, isLoading: isLoadingBooks } = useGetBooksQuery();
    const { data: memberDebt, isLoading: isLoadingMemberDebt } = useGetMemberDebtQuery(
        selectedMemberIdForIssue!, // Use non-null assertion as query is skipped if null
        { skip: selectedMemberIdForIssue === null } // Skip query if no member is selected
    );
    const { data: openTransactions, isLoading: isLoadingOpenTransactions } = useGetOpenTransactionsByMemberQuery(
        selectedMemberIdForReturn!, // Use non-null assertion as query is skipped if null
        { skip: selectedMemberIdForReturn === null } // Skip query if no member is selected
    );

    const [issueBook, { isLoading: isIssuing }] = useIssueBookMutation();
    const [returnBook, { isLoading: isReturning }] = useReturnBookMutation();

    // Handlers
    const handleIssueBook = async () => {
        if (selectedMemberIdForIssue === null || selectedBookIdForIssue === null) {
            setIssueFeedback('Please select both a member and a book.');
            return;
        }

        // Optional: Add a client-side check here using memberDebt before issuing,
        // although the backend check is the definitive one.
        // if (memberDebt && memberDebt.outstanding_debt >= 500) {
        //     setIssueFeedback(`Member debt (KES ${memberDebt.outstanding_debt}) exceeds limit.`);
        //     return;
        // }


        try {
            // The backend service handles the debt check and stock update
            const result = await issueBook({
                book_id: selectedBookIdForIssue,
                member_id: selectedMemberIdForIssue,
            }).unwrap(); // unwrap throws an error if the mutation fails
            setIssueFeedback(result.message || 'Book issued successfully!');
            // Clear form or reset state upon success
            setSelectedMemberIdForIssue(null);
            setSelectedBookIdForIssue(null);
            // Optionally trigger refetch for member debt and open transactions
            // This depends on how you want the UI to update, invalidatesTags helps with this
        } catch (error: any) {
            const errorMessage = error.data?.message || 'An error occurred while issuing the book.';
            setIssueFeedback(`Error: ${errorMessage}`);
        }
    };

    const handleReturnBook = async (transactionId: number) => {
        try {
            const result = await returnBook(transactionId).unwrap(); // unwrap throws error on failure
            setReturnFeedback(result.message || 'Book returned successfully!');
            // Optionally trigger refetch for open transactions for the selected member
            // or trigger a refetch for the member's debt if a fee was charged
        } catch (error: any) {
             const errorMessage = error.data?.message || 'An error occurred while returning the book.';
             setReturnFeedback(`Error: ${errorMessage}`);
        }
    };

    // Filter books to only show those with available stock
    const availableBooks = books?.filter(book => book.available_stock > 0);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Library Transactions Dashboard</h1>

            {/* Issue Book Section */}
            <section className="mb-8 bg-gray-100 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Issue a Book</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Member Selector */}
                    <div>
                        <label htmlFor="member-select-issue" className="block text-sm font-medium text-gray-700">
                            Select Member:
                        </label>
                        <select
                            id="member-select-issue"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            value={selectedMemberIdForIssue || ''}
                            onChange={(e) => setSelectedMemberIdForIssue(parseInt(e.target.value, 10) || null)}
                            disabled={isLoadingMembers}
                        >
                            <option value="">-- Select Member --</option>
                            {members?.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                        {isLoadingMembers && <p className="text-sm text-gray-500">Loading members...</p>}
                    </div>

                    {/* Book Selector */}
                    <div>
                        <label htmlFor="book-select-issue" className="block text-sm font-medium text-gray-700">
                            Select Book:
                        </label>
                        <select
                            id="book-select-issue"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            value={selectedBookIdForIssue || ''}
                            onChange={(e) => setSelectedBookIdForIssue(parseInt(e.target.value, 10) || null)}
                            disabled={isLoadingBooks || !availableBooks || availableBooks.length === 0}
                        >
                             <option value="">-- Select Book --</option>
                            {availableBooks?.map((book) => (
                                <option key={book.id} value={book.id}>
                                    {book.title} by {book.author} (Stock: {book.available_stock})
                                </option>
                            ))}
                        </select>
                         {isLoadingBooks && <p className="text-sm text-gray-500">Loading books...</p>}
                         {!isLoadingBooks && (!availableBooks || availableBooks.length === 0) && (
                              <p className="text-sm text-red-600">No books available to issue.</p>
                         )}
                    </div>
                </div>

                 {/* Member Debt Display (Conditional) */}
                {selectedMemberIdForIssue !== null && (
                    <div className="mt-4">
                         {isLoadingMemberDebt ? (
                              <p className="text-sm text-gray-500">Loading member debt...</p>
                         ) : memberDebt ? (
                              <p className={`text-sm font-semibold ${memberDebt.outstanding_debt >= 500 ? 'text-red-600' : 'text-gray-700'}`}>
                                   Selected Member Debt: KES {memberDebt.outstanding_debt.toFixed(2)}
                                   {memberDebt.outstanding_debt >= 500 && " (Exceeds limit!)"}
                              </p>
                         ) : (
                              <p className="text-sm text-red-600">Could not load member debt.</p>
                         )}
                    </div>
                 )}


                <button
                    onClick={handleIssueBook}
                    disabled={isIssuing || selectedMemberIdForIssue === null || selectedBookIdForIssue === null || (memberDebt?.outstanding_debt ?? 0) >= 500}
                    className={`mt-6 px-6 py-2 rounded-md text-white font-semibold ${
                        isIssuing || selectedMemberIdForIssue === null || selectedBookIdForIssue === null || (memberDebt?.outstanding_debt ?? 0) >= 500
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                    {isIssuing ? 'Issuing...' : 'Issue Book'}
                </button>

                {issueFeedback && (
                    <p className={`mt-4 text-sm ${issueFeedback.startsWith('Error:') ? 'text-red-600' : 'text-green-600'}`}>
                        {issueFeedback}
                    </p>
                )}
            </section>

            {/* Return Book Section */}
            <section className="bg-gray-100 p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-semibold mb-4">Return a Book</h2>
                 <div className="mb-4">
                     <label htmlFor="member-select-return" className="block text-sm font-medium text-gray-700">
                         Select Member to view their issued books:
                     </label>
                     <select
                         id="member-select-return"
                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                         value={selectedMemberIdForReturn || ''}
                         onChange={(e) => setSelectedMemberIdForReturn(parseInt(e.target.value, 10) || null)}
                         disabled={isLoadingMembers}
                     >
                         <option value="">-- Select Member --</option>
                         {members?.map((member) => (
                             <option key={member.id} value={member.id}>
                                 {member.name}
                             </option>
                         ))}
                     </select>
                     {isLoadingMembers && <p className="text-sm text-gray-500">Loading members...</p>}
                 </div>


                 {selectedMemberIdForReturn !== null && (
                      <div className="mt-6">
                           <h3 className="text-lg font-medium mb-3">Issued Books for Selected Member:</h3>
                           {isLoadingOpenTransactions ? (
                               <p className="text-gray-500">Loading issued books...</p>
                           ) : openTransactions && openTransactions.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                   {openTransactions.map((transaction) => (
                                       <li key={transaction.id} className="py-4 flex justify-between items-center">
                                           <div>
                                               <p className="text-sm font-semibold">{/* You'll need to fetch book title/author here or include it in the transaction query result */}</p>
                                               <p className="text-sm text-gray-600">Issued On: {new Date(transaction.issue_date).toLocaleDateString()}</p>
                                           </div>
                                           <button
                                               onClick={() => handleReturnBook(transaction.id)}
                                               disabled={isReturning}
                                               className={`px-4 py-2 text-sm rounded-md text-white font-semibold ${
                                                   isReturning ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                                               }`}
                                           >
                                               {isReturning ? 'Processing...' : 'Return Book'}
                                           </button>
                                       </li>
                                   ))}
                               </ul>
                           ) : (
                               <p className="text-gray-600">No books currently issued to this member.</p>
                           )}
                      </div>
                 )}


                {returnFeedback && (
                    <p className={`mt-4 text-sm ${returnFeedback.startsWith('Error:') ? 'text-red-600' : 'text-green-600'}`}>
                        {returnFeedback}
                    </p>
                )}
            </section>
        </div>
    );
};

export default TransactionDashboardPage;