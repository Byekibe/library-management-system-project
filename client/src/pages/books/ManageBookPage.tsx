// src/pages/ManageBooksPage.tsx // Example Page
import React from 'react';
import BookList from '@/components/books/BookList'; // Adjust path

const ManageBooksPage: React.FC = () => {
  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Book Management</h1>
      <BookList />
    </div>
  );
};

export default ManageBooksPage;