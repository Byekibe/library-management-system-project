// src/components/MemberDeleteButton.tsx
import React from 'react';
import { useDeleteMemberMutation } from '@/features/member/memberApi';

interface MemberDeleteButtonProps {
  memberId: number;
  memberName: string; // Optional: for confirmation message
  onDeleted?: () => void; // Optional callback after successful deletion
  customTrigger?: React.ReactNode;
}

const MemberDeleteButton: React.FC<MemberDeleteButtonProps> = ({ memberId, memberName, onDeleted }) => {
  const [deleteMember, { isLoading, error }] = useDeleteMemberMutation();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${memberName || 'this member'}?`)) {
      try {
        await deleteMember(memberId).unwrap();
        // RTK Query automatically handles cache invalidation based on providesTags/invalidatesTags
        if (onDeleted) {
            onDeleted(); // Call parent handler if needed (e.g., remove from list UI)
        }
        alert('Member deleted successfully!'); // Or use a more sophisticated notification
      } catch (err) {
        console.error('Failed to delete member:', err);
         // Handle mutation error
        alert('Failed to delete member.');
      }
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className={`px-3 py-1 text-white rounded ${isLoading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} text-sm`}
      >
        {isLoading ? 'Deleting...' : 'Delete'}
      </button>
       {/* You might display the error message here */}
       {error && <div className="text-red-600 text-sm mt-1">Error deleting member.</div>}
    </>
  );
};

export default MemberDeleteButton;