// src/components/BookList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Info,
  Loader2,
  BookOpen,
} from 'lucide-react';
import {
  useGetBooksQuery,
  useSearchBooksQuery,
  useDeleteBookMutation,
} from '@/features/book/bookApi';

// Import shadcn/ui components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

// Define the Book type
interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  available_stock: number;
  total_stock: number;
}

const BookList: React.FC = () => {
  const navigate = useNavigate();
  
  // State for search and delete confirmation
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<number | null>(null);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Use appropriate query based on search term
  const {
    data: books,
    error,
    isLoading: isLoadingBooks,
    isError,
    isFetching: isSearching,
  } = debouncedSearchTerm
    ? useSearchBooksQuery(debouncedSearchTerm)
    : useGetBooksQuery();

  // Delete book mutation
  const [deleteBook, { isLoading: isDeleting }] = useDeleteBookMutation();

  // Handle opening delete confirmation dialog
  const handleDeleteClick = (bookId: number) => {
    setBookToDelete(bookId);
    setDeleteDialogOpen(true);
  };

  // Handle confirming delete action
  const handleConfirmDelete = async () => {
    if (bookToDelete !== null) {
      try {
        await deleteBook(bookToDelete).unwrap();
        console.log(`Book ${bookToDelete} deleted successfully.`);
      } catch (err) {
        console.error('Failed to delete book:', err);
      } finally {
        setDeleteDialogOpen(false);
        setBookToDelete(null);
      }
    }
  };

  // Navigation handlers
  const handleAddBookClick = () => {
    navigate('/books/new');
  };

  const handleEditBookClick = (bookId: number) => {
    navigate(`/books/edit/${bookId}`);
  };

  const handleViewDetailsClick = (bookId: number) => {
    navigate(`/books/${bookId}`);
  };

  const isLoading = isLoadingBooks || isSearching;

  // Determine stock status for badge color
  const getStockBadge = (available: number, total: number) => {
    const ratio = available / total;
    
    if (ratio === 0) return <Badge variant="destructive">{available}/{total}</Badge>;
    if (ratio < 0.2) return <Badge variant="default">{available}/{total}</Badge>;
    return <Badge variant="destructive">{available}/{total}</Badge>;
  };

  return (
    <Card className="max-w-6xl mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Manage Books</CardTitle>
            <CardDescription>View, search, and manage your book inventory</CardDescription>
          </div>
          <Button onClick={handleAddBookClick} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" /> Add New Book
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading books...</span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <Info className="h-6 w-6 text-red-500" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error loading books: {error && 'status' in error ? `Error ${error.status}` : 'An unknown error occurred.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && (!books || books.length === 0) && (
          <div className="text-center py-10 text-gray-500">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">No books found</h3>
            <p className="mt-1">
              {debouncedSearchTerm 
                ? `No results for "${debouncedSearchTerm}"`
                : "Add a new book to get started"}
            </p>
          </div>
        )}

        {/* Books Table */}
        {!isLoading && !isError && books && books.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book: Book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.id}</TableCell>
                    <TableCell 
                      className="text-blue-600 hover:text-blue-800 cursor-pointer"
                      onClick={() => handleViewDetailsClick(book.id)}
                    >
                      {book.title}
                    </TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.isbn || '-'}</TableCell>
                    <TableCell>
                      {getStockBadge(book.available_stock, book.total_stock)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditBookClick(book.id)}
                        title="Edit Book"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(book.id)}
                        disabled={isDeleting}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete Book"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this book? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default BookList;