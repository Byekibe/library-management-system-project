// src/types/member.ts
export interface Member {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    outstanding_debt: number;
  }
  
  export interface CreateMemberRequest {
    name: string;
    email?: string;
    phone?: string;
  }
  
  export interface UpdateMemberRequest {
    name?: string;
    email?: string;
    phone?: string;
  }
  
  export interface MemberDebt {
    member_id: number;
    outstanding_debt: number;
  }
  
  export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
  }

  // Define the types for the mutation request and response
export interface RecordPaymentRequest {
  memberId: number;
  amount: number;
}
  
export interface RecordPaymentResponse {
  message: string; // Based on your Flask route's success response
  // Your backend might return updated member data here as well
  // data?: Member; // Example if backend returns updated member
}
