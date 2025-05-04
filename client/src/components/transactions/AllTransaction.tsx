import React, { useState } from 'react';
import { useGetAllTransactionsQuery } from '@/features/transaction/transactionApi';
import { useGetBooksQuery } from '@/features/book/bookApi';
import { useGetMembersQuery } from '@/features/member/memberApi';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpDown, 
  BookOpen, 
  Calendar, 
  Clock, 
  CreditCard, 
  Search, 
  User, 
  Filter,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

// Define transaction status types for better styling
type TransactionStatus = 'issued' | 'returned' | 'overdue' | string;

// Define available sort fields
type SortField = 'id' | 'book' | 'member' | 'issue_date' | 'return_date' | 'fee_charged' | 'status';

const TransactionHistoryTable: React.FC = () => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // RTK Query hooks for data fetching
  const {
    data: transactions,
    error: transactionsError,
    isLoading: transactionsLoading,
    isFetching: transactionsFetching,
    refetch: refetchTransactions
  } = useGetAllTransactionsQuery();

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

  // Helper functions
  const getBookTitle = (bookId: number): string => {
    if (!books) return `Book ID: ${bookId}`;
    const book = books.find(b => b.id === bookId);
    return book ? `${book.title} by ${book.author}` : `Book ID: ${bookId}`;
  };

  const getMemberName = (memberId: number): string => {
    if (!members) return `Member ID: ${memberId}`;
    const member = members.find(m => m.id === memberId);
    return member ? member.name : `Member ID: ${memberId}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Failed to parse date:", dateString, e);
      return dateString;
    }
  };

  // Status badge color mapping
  const getStatusBadgeProps = (status: TransactionStatus) => {
    switch (status.toLowerCase()) {
      case 'issued':
        return { variant: "outline" as const, className: "bg-blue-50 text-blue-700 border-blue-200" };
      case 'returned':
        return { variant: "outline" as const, className: "bg-green-50 text-green-700 border-green-200" };
      case 'overdue':
        return { variant: "outline" as const, className: "bg-red-50 text-red-700 border-red-200" };
      default:
        return { variant: "outline" as const, className: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  // Loading and error states
  const isLoading = transactionsLoading || transactionsFetching || booksLoading || membersLoading;
  const isError = transactionsError || booksError || membersError;

  // Filter and sort transactions
  const filteredAndSortedTransactions = React.useMemo(() => {
    if (!transactions) return [];
    
    // First apply filters
    let filtered = [...transactions];
    
    // Apply status filter if any are selected
    if (statusFilter.length > 0) {
      filtered = filtered.filter(t => statusFilter.includes(t.status.toLowerCase()));
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => {
        const bookTitle = getBookTitle(t.book_id).toLowerCase();
        const memberName = getMemberName(t.member_id).toLowerCase();
        return (
          bookTitle.includes(term) || 
          memberName.includes(term) || 
          t.status.toLowerCase().includes(term)
        );
      });
    }
    
    // Then sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'book':
          comparison = getBookTitle(a.book_id).localeCompare(getBookTitle(b.book_id));
          break;
        case 'member':
          comparison = getMemberName(a.member_id).localeCompare(getMemberName(b.member_id));
          break;
        case 'issue_date':
          comparison = (a.issue_date || '').localeCompare(b.issue_date || '');
          break;
        case 'return_date':
          comparison = (a.return_date || '').localeCompare(b.return_date || '');
          break;
        case 'fee_charged':
          comparison = Number(a.fee_charged) - Number(b.fee_charged);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [transactions, books, members, sortField, sortDirection, searchTerm, statusFilter]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil((filteredAndSortedTransactions?.length || 0) / itemsPerPage));
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle sort direction when clicking on a column header
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Extract unique statuses for filter dropdown
  const availableStatuses = React.useMemo(() => {
    if (!transactions) return [];
    return [...new Set(transactions.map(t => t.status.toLowerCase()))];
  }, [transactions]);

  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } 
      return [...prev, status];
    });
  };

  // Skeleton loader for table rows
  const TableRowSkeleton = () => (
    <TableRow>
      {Array(7).fill(0).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-6 w-full" /></TableCell>
      ))}
    </TableRow>
  );

  // Handle Pagination Click
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Transaction History
            </CardTitle>
            <CardDescription>
              View all book borrowing and return transactions
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchTransactions()} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="flex flex-col gap-4 mt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by book, member or status..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filter Status
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {availableStatuses.map(status => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={() => toggleStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
              {statusFilter.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => setStatusFilter([])}
                >
                  Clear Filters
                </Button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        {isError ? (
          <div className="p-8 text-center">
            <p className="text-red-600 font-medium">Error loading transaction data</p>
            <p className="text-gray-600 mt-2">Please try refreshing the page</p>
            <Button 
              variant="outline"
              className="mt-4"
              onClick={() => refetchTransactions()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16" onClick={() => toggleSort('id')}>
                      <div className="flex items-center cursor-pointer hover:text-primary">
                        ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort('book')}>
                      <div className="flex items-center cursor-pointer hover:text-primary">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Book
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort('member')}>
                      <div className="flex items-center cursor-pointer hover:text-primary">
                        <User className="mr-2 h-4 w-4" />
                        Member
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort('issue_date')}>
                      <div className="flex items-center cursor-pointer hover:text-primary">
                        <Calendar className="mr-2 h-4 w-4" />
                        Issue Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort('return_date')}>
                      <div className="flex items-center cursor-pointer hover:text-primary">
                        <Calendar className="mr-2 h-4 w-4" />
                        Return Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right" onClick={() => toggleSort('fee_charged')}>
                      <div className="flex items-center justify-end cursor-pointer hover:text-primary">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Fee (KES)
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort('status')}>
                      <div className="flex items-center cursor-pointer hover:text-primary">
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Show skeletons when loading
                    Array(5).fill(0).map((_, index) => (
                      <TableRowSkeleton key={index} />
                    ))
                  ) : paginatedTransactions.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-32">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Clock className="h-12 w-12 mb-2 opacity-20" />
                          <p className="text-xl font-medium">No transactions found</p>
                          <p className="text-sm mt-1">
                            {searchTerm || statusFilter.length > 0 
                              ? "Try adjusting your search or filters"
                              : "No transactions have been recorded yet"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Table data
                    paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell className="max-w-xs truncate" title={getBookTitle(transaction.book_id)}>
                          {getBookTitle(transaction.book_id)}
                        </TableCell>
                        <TableCell>{getMemberName(transaction.member_id)}</TableCell>
                        <TableCell>{formatDate(transaction.issue_date)}</TableCell>
                        <TableCell>
                          {transaction.return_date 
                            ? formatDate(transaction.return_date) 
                            : <span className="text-gray-400 italic">Not returned</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(transaction.fee_charged) > 0 
                            ? <span className="font-medium">{Number(transaction.fee_charged).toFixed(2)}</span>
                            : <span className="text-gray-400">0.00</span>}
                        </TableCell>
                        <TableCell>
                          <Badge {...getStatusBadgeProps(transaction.status)}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!isLoading && filteredAndSortedTransactions.length > 0 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {/* Show Pages */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Logic to show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      if (pageNum > 0 && pageNum <= totalPages) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistoryTable;