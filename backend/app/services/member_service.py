# app/services/member_service.py

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.extensions import db

class MemberService:
    """Service class for library member operations."""

    @staticmethod
    def create_member(name, email=None, phone=None):
        """Creates a new member record."""
        sql = text("""
        INSERT INTO members (name, email, phone, outstanding_debt)
        VALUES (:name, :email, :phone, :outstanding_debt)
        """)
        try:
            db.session.execute(sql, {
                'name': name,
                'email': email,
                'phone': phone,
                'outstanding_debt': 0.00
            })
            db.session.commit()
            result = db.session.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
            return result[0] if result else None
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Error creating member: {e}")
            return None

    @staticmethod
    def get_member(member_id):
        """Retrieves a member by their ID."""
        sql = text("""
        SELECT id, name, email, phone, outstanding_debt
        FROM members WHERE id = :member_id
        """)
        result = db.session.execute(sql, {'member_id': member_id}).mappings().fetchone()
        return dict(result) if result else None

    @staticmethod
    def get_all_members():
        """Retrieves all members."""
        sql = text("""
        SELECT id, name, email, phone, outstanding_debt
        FROM members
        """)
        results = db.session.execute(sql).mappings().fetchall()
        return [dict(row) for row in results]

    @staticmethod
    def update_member(member_id, data):
        """Updates a member record."""
        updates = []
        params = {'member_id': member_id}

        if 'name' in data:
            updates.append("name = :name")
            params['name'] = data['name']
        if 'email' in data:
            updates.append("email = :email")
            params['email'] = data['email']
        if 'phone' in data:
            updates.append("phone = :phone")
            params['phone'] = data['phone']

        if not updates:
            return False  # Nothing to update

        sql = text(f"""
        UPDATE members
        SET {', '.join(updates)}
        WHERE id = :member_id
        """)
        try:
            db.session.execute(sql, params)
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Error updating member {member_id}: {e}")
            return False

    @staticmethod
    def delete_member(member_id):
        """Deletes a member record."""
        member = MemberService.get_member(member_id)
        if not member:
            return False

        if member['outstanding_debt'] > 0:
            print(f"Cannot delete member {member_id}: Outstanding debt is KES {member['outstanding_debt']}.")
            return False

        open_tx_sql = text("""
        SELECT COUNT(*) FROM transactions
        WHERE member_id = :member_id AND is_returned = FALSE
        """)
        result = db.session.execute(open_tx_sql, {'member_id': member_id}).fetchone()
        if result and result[0] > 0:
            print(f"Cannot delete member {member_id}: Has {result[0]} open transactions.")
            return False

        sql = text("DELETE FROM members WHERE id = :member_id")
        try:
            db.session.execute(sql, {'member_id': member_id})
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"Error deleting member {member_id}: {e}")
            return False
        


    @staticmethod
    def get_member_debt(member_id):
        """
        Retrieves the outstanding debt for a member using mappings.
        Returns the debt amount (Decimal) or None if member not found.
        """
        sql = text("""
        SELECT outstanding_debt
        FROM members WHERE id = :member_id
        """)
        # Execute the query, apply mappings(), and fetch one result
        result = db.session.execute(sql, {'member_id': member_id}).mappings().fetchone()

        # Check if a member was found
        if result:
            # Access the column by its name using the mapping object
            return result['outstanding_debt']
        else:
            # Return None if no member with that ID is found
            return None
        
    # Add other member service methods here if you have them (e.g., get_member, create_member, etc.)
    @staticmethod
    def record_payment(member_id: int, amount: float):
        """
        Records a payment for a member, reducing their outstanding debt.

        Args:
            member_id: The ID of the member making the payment.
            amount: The payment amount.

        Returns:
            A tuple (success: bool, message: str).
        """
        if amount <= 0:
            return False, "Payment amount must be positive."

        # Ensure amount is a float and rounded to 2 decimal places for consistency
        payment_amount = round(float(amount), 2)

        try:
            # Check if the member exists
            member_check_sql = text("SELECT id FROM members WHERE id = :member_id")
            member_exists = db.session.execute(member_check_sql, {'member_id': member_id}).fetchone()
            if not member_exists:
                return False, f"Member with ID {member_id} not found."

            # SQL query to update the member's outstanding debt
            # We subtract the payment amount from the current debt
            update_sql = text("""
                UPDATE members
                SET outstanding_debt = outstanding_debt - :payment_amount
                WHERE id = :member_id
            """)

            # Execute the update query
            result = db.session.execute(update_sql, {
                'payment_amount': payment_amount,
                'member_id': member_id
            })

            # Check if a row was actually updated (should be 1 if member exists)
            if result.rowcount == 0:
                 # This case should ideally be caught by the member_exists check, but good as a fallback
                 db.session.rollback() # Rollback in case the member existed but something prevented update
                 return False, f"Failed to update debt for member ID {member_id}. Member might not exist."


            # Commit the transaction
            db.session.commit()

            return True, f"Payment of KES {payment_amount:.2f} recorded successfully for member ID {member_id}."

        except SQLAlchemyError as e:
            # Rollback the transaction in case of any database error
            db.session.rollback()
            print(f"Error recording payment for member ID {member_id}: {e}")
            return False, f"An error occurred while recording the payment: {e}"
        except Exception as e:
             # Catch any other unexpected errors
            db.session.rollback() # Ensure rollback even for non-SQLAlchemy errors
            print(f"An unexpected error occurred recording payment for member ID {member_id}: {e}")
            return False, f"An unexpected error occurred: {e}"