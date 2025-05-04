// src/pages/Dashboard.tsx (or where you place your dashboard component)
import React, { useState, useMemo } from 'react'; // Import useMemo
import { Link } from 'react-router'; // Import Link for navigation
import {
  AlertTriangle,
  BookOpen,
  RefreshCw,
  Search,
  Plus,
  ArrowUpRight
} from 'lucide-react'; // Assuming lucide-react is used for icons
import { useGetBooksQuery } from '@/features/book/bookApi'; // Adjust import path
import { useGetMembersQuery } from '@/features/member/memberApi'; // Adjust import path
import { useGetAllTransactionsQuery } from '@/features/transaction/transactionApi'; // Adjust import path
// Assuming these components are available from your UI library
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data using RTK Query hooks
  // Provide default empty arrays to avoid issues if data is undefined initially
  const { data: books = [], isLoading: booksLoading, error: booksError } = useGetBooksQuery();
  const { data: members = [], isLoading: membersLoading, error: membersError } = useGetMembersQuery();
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useGetAllTransactionsQuery();

  // Combine loading and error states
  const overallLoading = booksLoading || membersLoading || transactionsLoading;
  const overallError = booksError || membersError || transactionsError;

  // Helper to find book title by ID
  const getBookTitleById = (bookId: number): string => {
    const book = books.find(b => b.id === bookId);
    return book ? `${book.title} by ${book.author}` : `Book ID: ${bookId}`;
  };

  // Helper to find member name by ID
  const getMemberNameById = (memberId: number): string => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : `Member ID: ${memberId}`;
  };

   // Helper to find member email by ID
  // const getMemberEmailById = (memberId: number): string => {
  //   const member = members.find(m => m.id === memberId);
  //   return member ? member.email || 'No email' : 'No email';
  // };


  // Helper to format date
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString; // Return original if invalid
    }
  };

  // --- Data Processing and Filtering ---

  // Use useMemo to memoize filtered data and prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    // Calculate book statistics (not filtered by search query)
    const totalBooks = books.reduce((sum, book) => sum + book.total_stock, 0);
    const availableBooks = books.reduce((sum, book) => sum + book.available_stock, 0);
    const issuedBooksCount = books.reduce((sum, book) => sum + (book.total_stock - book.available_stock), 0);

    // Filter members with high debt
    const membersWithHighDebt = members
      .filter(member => Number(member.outstanding_debt) > 400)
      .filter(member => // Apply search filter
        member.name.toLowerCase().includes(lowerCaseQuery) ||
        (member.email || '').toLowerCase().includes(lowerCaseQuery) ||
        member.id.toString().includes(lowerCaseQuery) // Allow searching by ID
      )
      .sort((a, b) => Number(b.outstanding_debt) - Number(a.outstanding_debt))
      .slice(0, 3); // Still limit to top 3 *after* filtering

    // Filter recent transactions
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
      .filter(transaction => { // Apply search filter
           const bookTitle = getBookTitleById(transaction.book_id).toLowerCase();
           const memberName = getMemberNameById(transaction.member_id).toLowerCase();
           const transactionId = transaction.id.toString().toLowerCase();
           const issueDate = formatDate(transaction.issue_date).toLowerCase(); // Allow searching by formatted date

           return bookTitle.includes(lowerCaseQuery) ||
                  memberName.includes(lowerCaseQuery) ||
                  transactionId.includes(lowerCaseQuery) ||
                  issueDate.includes(lowerCaseQuery);
      })
      .slice(0, 5); // Still limit to latest 5 *after* filtering

    // Filter overdue transactions
    const LOAN_PERIOD_DAYS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
    const overdueTransactions = transactions.filter(transaction => {
      if (!transaction.is_returned) {
        const issueDate = new Date(transaction.issue_date);
        const currentDate = new Date();
        const timeDiff = currentDate.getTime() - issueDate.getTime();
        return timeDiff > LOAN_PERIOD_DAYS_MS;
      }
      return false;
    }).filter(transaction => { // Apply search filter
           const bookTitle = getBookTitleById(transaction.book_id).toLowerCase();
           const memberName = getMemberNameById(transaction.member_id).toLowerCase();
           const transactionId = transaction.id.toString().toLowerCase();
            const issueDate = formatDate(transaction.issue_date).toLowerCase(); // Allow searching by formatted date

           return bookTitle.includes(lowerCaseQuery) ||
                  memberName.includes(lowerCaseQuery) ||
                  transactionId.includes(lowerCaseQuery) ||
                  issueDate.includes(lowerCaseQuery);
      });
      // No slice here, display all overdue books that match the search

    return {
        totalBooks,
        availableBooks,
        issuedBooksCount,
        membersWithHighDebt,
        recentTransactions,
        overdueTransactions
    };

  }, [searchQuery, books, members, transactions]); // Dependencies for useMemo

  // Destructure filtered data
  const {
      totalBooks,
      availableBooks,
      issuedBooksCount,
      membersWithHighDebt,
      recentTransactions,
      overdueTransactions
  } = filteredData;


  // --- Loading and Error States ---

  if (overallLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          {/* Use a spinner icon */}
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <h2 className="mt-4 text-xl text-gray-700">Loading Dashboard Data...</h2>
        </div>
      </div>
    );
  }

  if (overallError) {
    console.error("Dashboard Data Load Error:", overallError);
    return (
      <div className="flex items-center justify-center h-screen">
         <div className="flex flex-col items-center">
            {/* Use an alert icon */}
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <h2 className="mt-4 text-xl text-red-700">Error loading dashboard data.</h2>
            <p className="text-gray-600 mt-2">Please check the console for details or try refreshing.</p>
         </div>
      </div>
    );
  }


  // --- Render Dashboard Content ---

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Library Dashboard</h1>
          <p className="text-md text-gray-600">Welcome back, Librarian!</p> {/* Personalized greeting */}
        </div>
        {/* Search functionality */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64"> {/* Make search bar responsive */}
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" /> {/* Adjust icon position */}
            <Input
              placeholder="Search..."
              className="pl-9 pr-3 py-2 border rounded-md w-full" // Improved styling
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> {/* Increased gap */}
        {/* Link to Issue Book Page */}
        <Link to="/issue"> {/* Use the route from AppRoutes.tsx */}
            <Button className="w-full flex items-center justify-center gap-2 h-12 text-lg" variant="default"> {/* Full width button, larger text */}
              <BookOpen className="h-5 w-5" /> {/* Larger icon */}
              <span>Issue Book</span>
            </Button>
        </Link>
        {/* Link to Return Book Page */}
         <Link to="/transactions/return/book"> {/* Use the route from AppRoutes.tsx */}
            <Button className="w-full flex items-center justify-center gap-2 h-12 text-lg" variant="outline"> {/* Full width button, larger text */}
              <RefreshCw className="h-5 w-5" /> {/* Larger icon */}
              <span>Return Book</span>
            </Button>
        </Link>
        {/* Link to Add Member Page */}
         <Link to="/members/create"> {/* Use the route from AppRoutes.tsx */}
            <Button className="w-full flex items-center justify-center gap-2 h-12 text-lg" variant="outline"> {/* Full width button, larger text */}
              <Plus className="h-5 w-5" /> {/* Larger icon */}
              <span>Add Member</span>
            </Button>
        </Link>
        {/* Link to Add Book Page */}
         <Link to="/books/new"> {/* Use the route from AppRoutes.tsx */}
            <Button className="w-full flex items-center justify-center gap-2 h-12 text-lg" variant="outline"> {/* Full width button, larger text */}
              <Plus className="h-5 w-5" /> {/* Larger icon */}
              <span>Add Book</span>
            </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"> {/* Responsive grid */}
        {/* Total Books Card - Added Link */}
        <Link to="/books" className="block">
          <Card className="hover:shadow-lg transition-shadow duration-200 h-full cursor-pointer"> {/* Added cursor-pointer */}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Books</CardTitle> {/* Slightly darker text */}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{totalBooks}</div> {/* Larger, bolder text */}
              <p className="text-sm text-gray-500 mt-1">
                {availableBooks} available
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Total Members Card - Added Link */}
        <Link to="/members" className="block">
          <Card className="hover:shadow-lg transition-shadow duration-200 h-full cursor-pointer"> {/* Added cursor-pointer */}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle> {/* Slightly darker text */}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{members.length}</div> {/* Larger, bolder text */}
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:shadow-lg transition-shadow duration-200"> {/* Added hover effect */}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Books Issued</CardTitle> {/* Slightly darker text */}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{issuedBooksCount}</div> {/* Larger, bolder text */}
             <p className="text-sm text-gray-500 mt-1">
              out of {totalBooks} total
            </p>
          </CardContent>
        </Card>

        {/* Overdue Books Card - Added Link to transactions page */}
        <Link to="/transactions/all" className="block">
          <Card className="border-red-300 hover:shadow-lg transition-shadow duration-200 h-full cursor-pointer"> {/* Added cursor-pointer */}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Overdue Books</CardTitle> {/* Slightly darker red text */}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">{overdueTransactions.length}</div> {/* Larger, bolder, darker red text */}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alerts Section - High Priority Items */}
      {membersWithHighDebt.length > 0 && (
        <Alert className="bg-amber-100 border-amber-400 text-amber-800"> {/* Improved alert colors */}
          <AlertTriangle className="h-5 w-5 text-amber-600" /> {/* Larger icon */}
          <AlertTitle className="font-semibold text-amber-800">Debt Limit Warning</AlertTitle> {/* Bolder title */}
          <AlertDescription className="text-amber-700">
            {membersWithHighDebt.length} member(s) approaching KES 500 debt limit. Review their accounts.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="hover:shadow-lg transition-shadow duration-200"> {/* Added hover effect */}
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Recent Transactions</CardTitle> {/* Larger, bolder title */}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200"> {/* Added divider color */}
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150"> {/* Added hover effect */}
                    <div>
                      {/* Display Book Title and Member Name */}
                      <p className="font-medium text-gray-900">{getBookTitleById(transaction.book_id)}</p>
                      <p className="text-sm text-gray-600">Member: {getMemberNameById(transaction.member_id)}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      {/* Use Badge variant based on status */}
                      <Badge variant={transaction.status === 'Returned' ? "outline" : transaction.status === 'Overdue' ? "destructive" : "secondary"}>
                        {transaction.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(transaction.issue_date)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                 <p className="text-center py-8 text-gray-500">No recent transactions matching search.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-200 p-4 bg-gray-50"> {/* Added border color and background */}
            {/* Link to All Transactions Page */}
             <Link to="/transactions/all" className="ml-auto"> {/* Use the route from AppRoutes.tsx */}
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                  View all <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
             </Link>
          </CardFooter>
        </Card>

        {/* Members with High Debt */}
        <Card className="hover:shadow-lg transition-shadow duration-200"> {/* Added hover effect */}
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">High Debt Members</CardTitle> {/* Larger, bolder title */}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200"> {/* Added divider color */}
              {membersWithHighDebt.length > 0 ? (
                membersWithHighDebt.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150"> {/* Added hover effect */}
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-4"> {/* Larger avatar */}
                        <AvatarFallback className="bg-blue-200 text-blue-800 font-semibold text-md"> {/* Improved avatar fallback style */}
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)} {/* Use first two initials */}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {/* Link to Record Payment Page */}
                       <Link to={`/members/${member.id}/pay-debt`}> {/* Use the route from AppRoutes.tsx */}
                            <p className="font-bold text-red-600 hover:underline cursor-pointer"> {/* Style debt as clickable */}
                                KES {Number(member.outstanding_debt).toFixed(2)} {/* Show cents */}
                            </p>
                       </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-gray-500">No members with high debt matching search.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-200 p-4 bg-gray-50"> {/* Added border color and background */}
            {/* Link to Members List Page (or a filtered view if available) */}
            <Link to="/members" className="ml-auto"> {/* Link to the general members list */}
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                  View all <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Overdue Books Section (Always show if there are overdue books) */}
      {overdueTransactions.length > 0 && (
        <Card className="border-red-300 hover:shadow-lg transition-shadow duration-200"> {/* Border and hover effect */}
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-red-700">Overdue Books</CardTitle> {/* Bolder, darker red title */}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200"> {/* Added divider color */}
              {/* Display all overdue books that match the search */}
              {overdueTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150"> {/* Added hover effect */}
                  <div>
                     {/* Display Book Title and Member Name */}
                    <p className="font-medium text-gray-900">{getBookTitleById(transaction.book_id)}</p>
                    <p className="text-sm text-gray-600">Member: {getMemberNameById(transaction.member_id)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">Overdue</Badge> {/* Red badge for overdue */}
                    <p className="text-xs text-gray-500 mt-1">
                      Issued: {formatDate(transaction.issue_date)}
                    </p>
                     {/* Link to return this specific book */}
                     <Link to={`/transactions/return/book`} className="text-blue-600 hover:underline text-xs mt-1 inline-block">Return Now</Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-200 p-4 bg-gray-50">
             <Link to="/transactions/all" className="ml-auto">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                  View all <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
             </Link>
          </CardFooter>
        </Card>
      )}
       {/* Display message if no overdue books match search */}
       {!overallLoading && !overallError && overdueTransactions.length === 0 && searchQuery !== '' && (
           <p className="text-center py-8 text-gray-500">No overdue books matching search.</p>
       )}
    </div>
  );
};

export default Dashboard;