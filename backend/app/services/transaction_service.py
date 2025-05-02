# app/services/transaction_service.py

from datetime import datetime
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.extensions import db

# Constants
LOAN_PERIOD_DAYS = 7
DAILY_FEE = 5.00
FIXED_RETURN_FEE = 10.00
DEBT_LIMIT = 500.00

class TransactionService:
    """Service class for managing book transactions."""

    @staticmethod
    def get_all_transactions():
        """Retrieves all transactions."""
        # SQL query to select transaction details, joining with books and members
        # to include related information like book title and member name.
        sql = text("""
        SELECT
            t.id,
            t.book_id,
            b.title AS book_title,
            t.member_id,
            m.name AS member_name,
            t.issue_date,
            t.return_date,
            t.fee_charged,
            t.is_returned,
            t.status
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        JOIN members m ON t.member_id = m.id
        ORDER BY t.issue_date DESC -- Order by issue date, newest first
        """)
        try:
            results = db.session.execute(sql).fetchall()
            # Convert list of row objects to list of dictionaries
            transactions_list = [dict(row) for row in results]
            return transactions_list
        except SQLAlchemyError as e:
            db.session.rollback() # Rollback in case of an error during query execution
            print(f"Error retrieving all transactions: {e}")
            # Consider logging the error properly in a real application
            return [] # Return an empty list or None to indicate failure/no data

    @staticmethod
    def calculate_fee(issue_date, return_date):
        """Calculates the fee for a transaction."""
        if not issue_date or not return_date:
            return 0.00
        days_issued = (return_date - issue_date).days
        if days_issued > LOAN_PERIOD_DAYS:
            overdue_days = days_issued - LOAN_PERIOD_DAYS
            return round(overdue_days * DAILY_FEE, 2)
        return 0.00
        # return FIXED_RETURN_FEE  # Alternative: fixed fee on return

    @staticmethod
    def get_member_debt(member_id):
        sql = text("SELECT outstanding_debt FROM members WHERE id = :member_id")
        result = db.session.execute(sql, {'member_id': member_id}).fetchone()
        return float(result[0]) if result else None

    @staticmethod
    def issue_book(book_id, member_id):
        """Issues a book to a member."""
        try:
            # Check book stock
            book_sql = text("SELECT available_stock FROM books WHERE id = :book_id")
            book_result = db.session.execute(book_sql, {'book_id': book_id}).fetchone()
            if not book_result or book_result[0] <= 0:
                return False, "Book not available."

            # Check member debt
            debt = TransactionService.get_member_debt(member_id)
            if debt is None:
                return False, "Member not found."
            if debt >= DEBT_LIMIT:
                return False, f"Member has outstanding debt (KES {debt}) exceeding limit."

            # Decrement stock and create transaction
            db.session.execute(text(
                "UPDATE books SET available_stock = available_stock - 1 WHERE id = :book_id"
            ), {'book_id': book_id})

            db.session.execute(text("""
                INSERT INTO transactions (book_id, member_id, issue_date, is_returned, status)
                VALUES (:book_id, :member_id, :issue_date, :is_returned, :status)
            """), {
                'book_id': book_id,
                'member_id': member_id,
                'issue_date': datetime.now(),
                'is_returned': False,
                'status': 'Issued'
            })

            db.session.commit()
            return True, "Book issued successfully."

        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Issue Error: {e}")
            return False, "Error issuing book."

    @staticmethod
    def return_book(transaction_id):
        """Processes a return."""
        try:
            transaction_sql = text("""
                SELECT id, book_id, member_id, issue_date, return_date, is_returned
                FROM transactions WHERE id = :transaction_id
            """)
            result = db.session.execute(transaction_sql, {'transaction_id': transaction_id}).fetchone()
            if not result:
                return False, "Transaction not found."

            txn = dict(result)
            if txn['is_returned']:
                return False, "Book already returned."

            now = datetime.now()
            fee = TransactionService.calculate_fee(txn['issue_date'], now)

            # Update transaction
            db.session.execute(text("""
                UPDATE transactions SET return_date = :return_date,
                fee_charged = :fee_charged, is_returned = TRUE, status = 'Returned'
                WHERE id = :transaction_id
            """), {
                'return_date': now,
                'fee_charged': fee,
                'transaction_id': transaction_id
            })

            # Increment stock
            db.session.execute(text("""
                UPDATE books SET available_stock = available_stock + 1 WHERE id = :book_id
            """), {'book_id': txn['book_id']})

            # Add fee to member debt
            db.session.execute(text("""
                UPDATE members SET outstanding_debt = outstanding_debt + :fee WHERE id = :member_id
            """), {
                'fee': fee,
                'member_id': txn['member_id']
            })

            db.session.commit()
            return True, f"Book returned successfully. Fee charged: KES {fee:.2f}."

        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Return Error: {e}")
            return False, "Error returning book."

    @staticmethod
    def get_transactions_by_member(member_id):
        sql = text("""
            SELECT t.id, t.book_id, b.title AS book_title, t.member_id, t.issue_date,
            t.return_date, t.fee_charged, t.is_returned, t.status
            FROM transactions t
            JOIN books b ON t.book_id = b.id
            WHERE t.member_id = :member_id
            ORDER BY t.issue_date DESC
        """)
        results = db.session.execute(sql, {'member_id': member_id}).fetchall()
        return [dict(row) for row in results]

    @staticmethod
    def get_open_transactions_by_member(member_id):
        sql = text("""
            SELECT t.id, t.book_id, b.title AS book_title, t.member_id, t.issue_date,
            t.return_date, t.fee_charged, t.is_returned, t.status
            FROM transactions t
            JOIN books b ON t.book_id = b.id
            WHERE t.member_id = :member_id AND t.is_returned = FALSE
            ORDER BY t.issue_date DESC
        """)
        results = db.session.execute(sql, {'member_id': member_id}).fetchall()
        return [dict(row) for row in results]
