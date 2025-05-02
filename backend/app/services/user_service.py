from sqlalchemy.exc import SQLAlchemyError
from app.extensions import db
from app.models.user import User
from sqlalchemy import text

class UserService:
    """Service class for user operations"""
    
    @staticmethod
    def get_all_users():
        """Get all users."""
        try:
            # Example of raw SQL query
            users = db.session.execute(text("SELECT * FROM users")).fetchall()
            return [dict(user) for user in users]
            
            # Alternative using ORM:
            # users = User.query.all()
            # return [user.to_dict() for user in users]
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID."""
        try:
            # Example using ORM
            user = User.query.get(user_id)
            return user.to_dict() if user else None
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def create_user(username, email, password):
        """Create a new user."""
        try:
            # Example using ORM
            user = User(
                username=username,
                email=email,
                password_hash=password  # This would be hashed in real implementation
            )
            db.session.add(user)
            db.session.commit()
            return user.to_dict()
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def update_user(user_id, **kwargs):
        """Update user data."""
        try:
            user = User.query.get(user_id)
            if not user:
                return None
            
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            
            db.session.commit()
            return user.to_dict()
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def delete_user(user_id):
        """Delete a user."""
        try:
            user = User.query.get(user_id)
            if not user:
                return False
            
            db.session.delete(user)
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e