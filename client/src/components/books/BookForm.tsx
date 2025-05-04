import React, { useEffect } from 'react';
import { useGetBookQuery, useCreateBookMutation, useUpdateBookMutation } from '@/features/book/bookApi';
import { CreateBookRequest, UpdateBookRequest } from '@/types/bookTypes';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Book, Library, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Form validation schema
const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional(),
  total_stock: z.coerce.number().int().min(0, "Stock must be a non-negative number")
});

type BookFormValues = z.infer<typeof bookFormSchema>;

interface BookFormProps {
  bookId?: number;
  onSuccess?: () => void;
}

const BookForm: React.FC<BookFormProps> = ({ bookId, onSuccess }) => {
  const isEditMode = bookId !== undefined;

  // API Queries & Mutations
  const { 
    data: bookData, 
    isLoading: isLoadingBook, 
    isError: isErrorBook, 
    error: bookError 
  } = useGetBookQuery(bookId!, { skip: !isEditMode });
  
  const [createBook, { isLoading: isCreating, isSuccess: isCreatedSuccess, isError: isCreateError, error: createError }] = useCreateBookMutation();
  const [updateBook, { isLoading: isUpdating, isSuccess: isUpdatedSuccess, isError: isUpdateError, error: updateError }] = useUpdateBookMutation();

  // Combined states
  const isLoading = isLoadingBook || isCreating || isUpdating;
  const isSuccess = isCreatedSuccess || isUpdatedSuccess;
  const isError = isCreateError || isUpdateError;
  const error = createError || updateError;

  // Initialize form with react-hook-form
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      total_stock: 0
    },
    mode: "onChange"
  });

  // Update form with book data when in edit mode
  useEffect(() => {
    if (isEditMode && bookData) {
      form.reset({
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn || "",
        total_stock: bookData.total_stock
      });
    }
  }, [bookData, form, isEditMode]);

  // Handle success state
  useEffect(() => {
    if (isSuccess && onSuccess) {
      toast(`${form.getValues("title")} has been ${isEditMode ? "updated" : "added"} to the library.`)
    }
  }, [isSuccess, isEditMode, onSuccess, form]);

  // Handle form submission
  const onSubmit = async (values: BookFormValues) => {
    try {
      if (isEditMode && bookId !== undefined) {
        // Update existing book
        const updateBody: UpdateBookRequest = {
          title: values.title,
          author: values.author,
          isbn: values.isbn || undefined,
          total_stock: values.total_stock
        };
        await updateBook({ id: bookId, book: updateBody }).unwrap();
      } else {
        // Create new book
        const createBody: CreateBookRequest = {
          title: values.title,
          author: values.author,
          isbn: values.isbn || undefined,
          total_stock: values.total_stock
        };
        await createBook(createBody).unwrap();
      }
    } catch (err) {
      console.error(`Failed to ${isEditMode ? "update" : "create"} book:`, err);
      // Error state handled by isError/error
    }
  };

  // Show loading state when fetching book details
  if (isEditMode && isLoadingBook) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg font-medium">Loading book details...</span>
      </div>
    );
  }

  // Show error state when book fetch fails
  if (isEditMode && isErrorBook) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load book details: {bookError && 'status' in bookError 
            ? `Error ${bookError.status}` 
            : 'An unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <Library className="h-6 w-6 text-blue-500" />
          ) : (
            <Book className="h-6 w-6 text-green-500" />
          )}
          <CardTitle className="text-2xl">
            {isEditMode ? `Edit Book` : 'Add New Book'}
          </CardTitle>
        </div>
        <CardDescription>
          {isEditMode 
            ? `Update the details for this book (ID: ${bookId})`
            : 'Enter the details to add a new book to the library'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter book title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter author name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isbn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ISBN</FormLabel>
                  <FormControl>
                    <Input placeholder="ISBN (optional)" {...field} />
                  </FormControl>
                  <FormDescription>
                    International Standard Book Number (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="total_stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Stock</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="Enter quantity available" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error && 'status' in error 
                    ? `Error ${error.status}: ${(error.data as { message?: string })?.message || 'Unknown error'}`
                    : 'An unknown error occurred.'}
                </AlertDescription>
              </Alert>
            )}
            
            {isSuccess && (
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Book successfully {isEditMode ? 'updated' : 'added'} to the library.
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Update Book' : 'Add Book'}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4 text-sm text-gray-500">
        <div>
          {isEditMode 
            ? 'Editing existing book record' 
            : 'Adding new book to inventory'}
        </div>
        <div>* Required fields</div>
      </CardFooter>
    </Card>
  );
};

export default BookForm;