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
        result = db.session.execute(sql, {'member_id': member_id}).fetchone()
        return dict(result) if result else None

    @staticmethod
    def get_all_members():
        """Retrieves all members."""
        sql = text("""
        SELECT id, name, email, phone, outstanding_debt
        FROM members
        """)
        results = db.session.execute(sql).fetchall()
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
