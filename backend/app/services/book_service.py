# app/services/book_service.py

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from .. import db

class BookService:
    """Service class for book operations in the library."""

    @staticmethod
    def create_book(title, author, total_stock, isbn=None):
        """Creates a new book record."""
        sql = text("""
        INSERT INTO books (title, author, isbn, total_stock, available_stock)
        VALUES (:title, :author, :isbn, :total_stock, :available_stock)
        """)
        try:
            db.session.execute(sql, {
                'title': title,
                'author': author,
                'isbn': isbn,
                'total_stock': total_stock,
                'available_stock': total_stock
            })
            db.session.commit()
            result = db.session.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
            return result[0] if result else None
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Error creating book: {e}")
            return None

    @staticmethod
    def get_book(book_id):
        """Retrieves a book by its ID."""
        sql = text("""
        SELECT id, title, author, isbn, total_stock, available_stock
        FROM books WHERE id = :book_id
        """)
        result = db.session.execute(sql, {'book_id': book_id}).fetchone()
        return dict(result) if result else None

    @staticmethod
    def get_all_books():
        """Retrieves all books."""
        sql = text("""
        SELECT id, title, author, isbn, total_stock, available_stock
        FROM books
        """)
        results = db.session.execute(sql).fetchall()
        return [dict(row) for row in results]

    @staticmethod
    def update_book(book_id, data):
        """Updates a book record."""
        sql = text("""
        UPDATE books
        SET title = :title, author = :author, isbn = :isbn,
            total_stock = :total_stock, available_stock = :available_stock
        WHERE id = :book_id
        """)
        try:
            current_book = BookService.get_book(book_id)
            if not current_book:
                return False

            old_total = current_book['total_stock']
            old_available = current_book['available_stock']
            new_total = data.get('total_stock', old_total)
            stock_diff = new_total - old_total
            new_available = old_available + stock_diff
            new_available = max(0, min(new_available, new_total))

            db.session.execute(sql, {
                'book_id': book_id,
                'title': data.get('title', current_book['title']),
                'author': data.get('author', current_book['author']),
                'isbn': data.get('isbn', current_book['isbn']),
                'total_stock': new_total,
                'available_stock': new_available
            })
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Error updating book {book_id}: {e}")
            return False

    @staticmethod
    def delete_book(book_id):
        """Deletes a book record if no issued copies are outstanding."""
        issued_sql = text("""
        SELECT COUNT(*) FROM transactions
        WHERE book_id = :book_id AND is_returned = FALSE
        """)
        result = db.session.execute(issued_sql, {'book_id': book_id}).fetchone()
        if result and result[0] > 0:
            print(f"Cannot delete book {book_id}: {result[0]} copies are currently issued.")
            return False

        sql = text("DELETE FROM books WHERE id = :book_id")
        try:
            db.session.execute(sql, {'book_id': book_id})
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Error deleting book {book_id}: {e}")
            return False

    @staticmethod
    def search_books(query):
        """Searches books by title or author."""
        sql = text("""
        SELECT id, title, author, isbn, total_stock, available_stock
        FROM books
        WHERE title LIKE :query OR author LIKE :query
        """)
        search_term = f"%{query}%"
        results = db.session.execute(sql, {'query': search_term}).fetchall()
        return [dict(row) for row in results]
