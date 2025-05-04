// src/pages/AddBookPage.tsx
import React from 'react';
import BookForm from '@/components/books/BookForm'; // Adjust path
import { useNavigate } from 'react-router'; // Example for redirection

const AddBookPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to book list after successful creation
    navigate('/admin/books'); // Adjust the route as needed
  };

  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Add New Book</h1>
      <BookForm onSuccess={handleSuccess} />
    </div>
  );
};

export default AddBookPage;