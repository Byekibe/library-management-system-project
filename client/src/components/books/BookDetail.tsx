// src/components/BookDetail.tsx
import React from 'react';
import { useParams } from 'react-router'; // Import useParams
import { useGetBookQuery } from '@/features/book/bookApi'; // Adjust import path
// Assuming you might want to link back or to edit
// import { Link } from 'react-router-dom'; // Uncomment if using React Router

// Remove the props interface as bookId will come from params
// interface BookDetailProps {
//   bookId: number;
// }

// Remove the bookId prop from the function signature
const BookDetail: React.FC = () => {
  // Get bookId from URL parameters
  // Assuming the route is configured like /books/:bookId or /admin/books/:bookId
  const { bookId } = useParams<{ bookId: string }>();

  // Convert the bookId string from the URL to a number
  const bookIdNum = bookId ? parseInt(bookId, 10) : undefined;

  // --- Add validation for the bookId ---
  // If bookId is missing in the URL or is not a valid number, show an error immediately
  if (bookIdNum === undefined || isNaN(bookIdNum)) {
    return (
      <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded-lg shadow-md text-center text-red-600">
        Invalid or missing Book ID in the URL.
      </div>
    );
  }
  // ----------------------------------


  // Fetch the specific book's data using the numeric bookId
  // RTK Query will skip the query if bookIdNum is undefined (handled by our check above)
  const { data: book, error, isLoading, isError } = useGetBookQuery(bookIdNum);

  if (isLoading) {
    return <div className="text-center py-4">Loading book details...</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-4 text-red-600">
        Error loading book details: {error && 'status' in error ? `Error ${error.status}` : 'An unknown error occurred.'}
      </div>
    );
  }

  // Handle case where book is not found (API returns success but no data)
  if (!book) {
      return (
           <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded-lg shadow-md text-center text-gray-600">
               Book with ID {bookIdNum} not found.
           </div>
       );
  }


  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Book Details</h2>
      <div className="space-y-3">
        <p>
          <span className="font-medium text-gray-700">ID:</span> {book.id}
        </p>
        <p>
          <span className="font-medium text-gray-700">Title:</span> {book.title}
        </p>
        <p>
          <span className="font-medium text-gray-700">Author:</span> {book.author}
        </p>
        {book.isbn && ( // Conditionally display ISBN if it exists
          <p>
            <span className="font-medium text-gray-700">ISBN:</span> {book.isbn}
          </p>
        )}
        <p>
          <span className="font-medium text-gray-700">Total Stock:</span> {book.total_stock}
        </p>
        <p>
          <span className="font-medium text-gray-700">Available Stock:</span> {book.available_stock}
        </p>
      </div>
       {/* Optional: Add navigation links */}
       {/* <div className="mt-6 flex justify-end">
           <Link to="/admin/books" className="text-blue-600 hover:underline mr-4">Back to List</Link>
           <Link to={`/admin/books/edit/${book.id}`} className="text-indigo-600 hover:underline">Edit Book</Link>
       </div> */}
    </div>
  );
};

export default BookDetail;