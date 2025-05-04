// src/types/transaction.ts
export interface Transaction {
    id: number;
    book_id: number;
    member_id: number;
    issue_date: string; // ISO date string format
    return_date: string | null; // ISO date string format or null if not returned
    fee_charged: number;
    is_returned: boolean;
    status: string; // 'Issued', 'Returned', 'Overdue', etc.
  }
  
  export interface IssueBookRequest {
    book_id: number;
    member_id: number;
  }
  
  export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
  }
  
