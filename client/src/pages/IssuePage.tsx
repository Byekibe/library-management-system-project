// src/pages/IssuePage.tsx
import React from 'react';
import IssueBookForm from '@/components/transactions/IssueBookForm'; // Adjust path

const IssuePage: React.FC = () => {
  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Issue a Book</h1>
      <IssueBookForm />
    </div>
  );
};

export default IssuePage;