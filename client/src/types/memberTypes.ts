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
  
