// src/components/MemberDetail.tsx
import React from 'react';
import { useParams } from 'react-router'; // Example for getting ID from URL
import { useGetMemberQuery, useGetMemberDebtQuery } from '@/features/member/memberApi';

const MemberDetail: React.FC = () => {
  // Assuming the route is like /members/:memberId
  const { memberId } = useParams<{ memberId: string }>();
  const id = memberId ? parseInt(memberId, 10) : undefined;

  // Fetch member details
  const { data: member, error: memberError, isLoading: memberLoading } = useGetMemberQuery(id!, {
    skip: id === undefined, // Skip query if id is not available
  });

  // Optionally fetch debt details
  const { data: debt, error: debtError, isLoading: debtLoading } = useGetMemberDebtQuery(id!, {
    skip: id === undefined, // Skip query if id is not available
  });


  if (id === undefined) {
    return <div className="text-center text-red-600">Invalid member ID.</div>;
  }

  if (memberLoading || debtLoading) {
    return <div className="text-center text-gray-600">Loading member details...</div>;
  }

  if (memberError || debtError) {
     // More robust error handling
    return <div className="text-center text-red-600">Error loading member details.</div>;
  }

  if (!member) {
      return <div className="text-center text-gray-600">Member not found.</div>;
  }


  return (
    <div className="container mx-auto p-4 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Member Details</h1>
      <div className="space-y-3">
        <div>
          <span className="font-semibold">ID:</span> {member.id}
        </div>
        <div>
          <span className="font-semibold">Name:</span> {member.name}
        </div>
        <div>
          <span className="font-semibold">Email:</span> {member.email || 'N/A'}
        </div>
        <div>
          <span className="font-semibold">Phone:</span> {member.phone || 'N/A'}
        </div>
        {/* Displaying debt fetched separately */}
        {debt ? (
             <div>
                <span className="font-semibold">Outstanding Debt:</span> {debt.outstanding_debt.toFixed(2)}
             </div>
        ) : (
             <div>
                 <span className="font-semibold">Outstanding Debt:</span> Not available
             </div>
        )}
         {/* Add more details as needed */}
      </div>
       {/* You might add Edit/Delete buttons here as well */}
    </div>
  );
};

export default MemberDetail;