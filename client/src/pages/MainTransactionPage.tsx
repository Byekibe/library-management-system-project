// src/pages/AdminDashboard.tsx // Example page
import React from 'react';
import AllTransactionsList from '@/components/transactions/AllTransaction'; // Adjust path

const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {/* Other admin components */}
      <AllTransactionsList />
    </div>
  );
};

export default AdminDashboard;