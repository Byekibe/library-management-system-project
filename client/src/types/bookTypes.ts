// src/types/book.ts
export interface Book {
    id: number;
    title: string;
    author: string;
    isbn?: string; // Optional field
    total_stock: number;
    available_stock: number;
  }
  
  export interface CreateBookRequest {
    title: string;
    author: string;
    total_stock: number;
    isbn?: string;
  }
  
  export interface UpdateBookRequest {
    title?: string;
    author?: string;
    isbn?: string;
    total_stock?: number;
  }
  
  export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
  }