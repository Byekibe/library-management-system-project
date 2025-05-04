// src/pages/EditBookPage.tsx
import React from 'react';
import BookForm from '@/components/books/BookForm'; // Adjust path
import { useParams, useNavigate } from 'react-router'; // Example for getting ID and redirection

const EditBookPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>(); // Get ID from URL
  const navigate = useNavigate();
  const bookIdNum = bookId ? parseInt(bookId, 10) : undefined;

  const handleSuccess = () => {
     // Redirect to book list after successful update
     navigate('/admin/books'); // Adjust the route as needed
  };

  if (bookIdNum === undefined) {
      // Handle case where bookId is missing or invalid in the URL
      return <div className="text-center text-red-600">Invalid Book ID</div>;
  }


  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Edit Book</h1>
      <BookForm bookId={bookIdNum} onSuccess={handleSuccess} />
    </div>
  );
};

export default EditBookPage;