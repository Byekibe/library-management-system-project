import jwt
import datetime
import uuid
from datetime import timedelta, timezone
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import SQLAlchemyError
from app.extensions import db
from app.models.user import User
from app.models.token_blocklist import TokenBlocklist
import os

class AuthService:
    """Service class for authentication operations"""
    
    JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')  # Should be in environment variables
    JWT_ALGORITHM = 'HS256'
    JWT_ACCESS_EXPIRY = datetime.timedelta(hours=1)
    JWT_REFRESH_EXPIRY = datetime.timedelta(days=30)
    
    @staticmethod
    def register(username, email, password):
        """Register a new user."""
        try:
            # Check if user already exists
            if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
                return {"status": "error", "message": "Username or email already exists"}, 400
            
            # Create new user
            password_hash = generate_password_hash(password)
            new_user = User(
                username=username,
                email=email,
                password_hash=password_hash
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            # Generate tokens
            access_token = AuthService.generate_access_token(new_user.id)
            refresh_token = AuthService.generate_refresh_token(new_user.id)
            
            return {
                "status": "success",
                "message": "User registered successfully",
                "data": {
                    "user": new_user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token
                }
            }, 201
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"status": "error", "message": str(e)}, 500
    
    @staticmethod
    def login(email, password):
        """Login a user."""
        try:
            # Find user by email
            user = User.query.filter_by(email=email).first()
            
            # Check if user exists and password is correct
            if not user or not check_password_hash(user.password_hash, password):
                return {"status": "error", "message": "Invalid credentials"}, 401
            
            # Check if user is active
            if not user.is_active:
                return {"status": "error", "message": "Account is deactivated"}, 403
            
            # Generate tokens
            access_token = AuthService.generate_access_token(user.id)
            refresh_token = AuthService.generate_refresh_token(user.id)
            
            return {
                "status": "success",
                "message": "Login successful",
                "data": {
                    "user": user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token
                }
            }, 200
            
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500
    
    @staticmethod
    def refresh_token(refresh_token):
        """Generate new access token using refresh token."""
        try:
            # Decode refresh token
            payload = jwt.decode(refresh_token, AuthService.JWT_SECRET, algorithms=[AuthService.JWT_ALGORITHM])
            
            # Check if token type is refresh
            if payload.get('type') != 'refresh':
                return {"status": "error", "message": "Invalid token type"}, 401
            
            # Get user
            user_id = payload.get('sub')
            user = User.query.get(user_id)
            
            if not user or not user.is_active:
                return {"status": "error", "message": "User not found or inactive"}, 401
            
            # Generate new access token
            new_access_token = AuthService.generate_access_token(user_id)
            
            return {
                "status": "success",
                "message": "Token refreshed",
                "data": {
                    "access_token": new_access_token
                }
            }, 200
            
        except jwt.ExpiredSignatureError:
            return {"status": "error", "message": "Refresh token expired"}, 401
        except jwt.InvalidTokenError:
            return {"status": "error", "message": "Invalid refresh token"}, 401
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500
    
    @staticmethod
    def forgot_password(email):
        """Initiate forgot password process."""
        try:
            # Find user by email
            user = User.query.filter_by(email=email).first()
            
            if not user:
                # For security reasons, still return success even if user doesn't exist
                return {
                    "status": "success",
                    "message": "If the email exists, a reset link will be sent"
                }, 200
            
            # Generate password reset token (short expiry)
            reset_token = AuthService.generate_password_reset_token(user.id)
            
            # Create reset URL
            baseServerUrl = os.environ.get('BASE_SERVER_URL', 'http://localhost:5000/api/v1')
            reset_url = f"{baseServerUrl}/auth/reset-password/{reset_token}"
            
            # Send email with reset link
            try:
                # Email configuration
                my_email = os.environ.get('EMAIL_USER')
                password = os.environ.get('EMAIL_PASSWORD')
                
                # Create message
                msg = MIMEMultipart()
                msg['To'] = email
                msg['Subject'] = "Password Reset Request"
                msg['From'] = my_email
                
                # Create email body
                body = f"""
                Hello {user.username},
                
                You recently requested to reset your password. Please click the link below to reset it:
                
                {reset_url}
                
                This link will expire in 1 hour.
                
                If you did not request a password reset, please ignore this email.
                
                Regards,
                Your Application Team
                """
                
                msg.attach(MIMEText(body, 'plain', 'utf-8'))
                
                # Send email
                with smtplib.SMTP('smtp.gmail.com', 587) as connection:
                    connection.starttls()
                    connection.login(my_email, password)
                    connection.sendmail(my_email, email, msg.as_string())
                
                return {
                    "status": "success",
                    "message": "Password reset email sent. Please check your inbox."
                }, 200
                
            except Exception as e:
                # Log the email sending error but don't expose details to client
                print(f"Email sending error: {str(e)}")
                return {
                    "status": "error", 
                    "message": "Failed to send reset email. Please try again later."
                }, 500
            
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500
    
    @staticmethod
    def reset_password(reset_token, new_password):
        """Reset password using reset token."""
        try:
            # Decode reset token
            payload = jwt.decode(reset_token, AuthService.JWT_SECRET, algorithms=[AuthService.JWT_ALGORITHM])
            
            # Check if token type is reset
            if payload.get('type') != 'reset':
                return {"status": "error", "message": "Invalid token type"}, 401
            
            # Get user
            user_id = payload.get('sub')
            user = User.query.get(user_id)
            
            if not user:
                return {"status": "error", "message": "User not found"}, 404
            
            # Update password
            user.password_hash = generate_password_hash(new_password)
            db.session.commit()
            
            return {
                "status": "success",
                "message": "Password reset successful"
            }, 200
            
        except jwt.ExpiredSignatureError:
            return {"status": "error", "message": "Reset token expired"}, 401
        except jwt.InvalidTokenError:
            return {"status": "error", "message": "Invalid reset token"}, 401
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"status": "error", "message": str(e)}, 500
    
    @staticmethod
    def generate_access_token(user_id):
        """Generate JWT access token."""
        jti = str(uuid.uuid4())  # Generate a unique token ID
        payload = {
            'sub': user_id,
            'type': 'access',
            'jti': jti,  # JWT ID for token revocation
            'iat': datetime.datetime.now(timezone.utc),
            'exp': datetime.datetime.now(timezone.utc) + AuthService.JWT_ACCESS_EXPIRY
        }
        return jwt.encode(payload, AuthService.JWT_SECRET, algorithm=AuthService.JWT_ALGORITHM)
    
    @staticmethod
    def generate_refresh_token(user_id):
        """Generate JWT refresh token."""
        jti = str(uuid.uuid4())  # Generate a unique token ID
        payload = {
            'sub': user_id,
            'type': 'refresh',
            'jti': jti,  # JWT ID for token revocation
            'iat': datetime.datetime.now(timezone.utc),
            'exp': datetime.datetime.now(timezone.utc) + AuthService.JWT_REFRESH_EXPIRY
        }
        return jwt.encode(payload, AuthService.JWT_SECRET, algorithm=AuthService.JWT_ALGORITHM)
    
    @staticmethod
    def generate_password_reset_token(user_id):
        """Generate password reset token."""
        payload = {
            'sub': user_id,
            'type': 'reset',
            'iat': datetime.datetime.now(timezone.utc),
            'exp': datetime.datetime.now(timezone.utc) + datetime.timedelta(hours=1)  # Short expiry for security
        }
        return jwt.encode(payload, AuthService.JWT_SECRET, algorithm=AuthService.JWT_ALGORITHM)

    @staticmethod
    def validate_token(token):
        """Validate JWT token."""
        try:
            payload = jwt.decode(token, AuthService.JWT_SECRET, algorithms=[AuthService.JWT_ALGORITHM])
            
            # Check if token is revoked
            jti = payload.get('jti')
            if jti and TokenBlocklist.is_token_revoked(jti):
                return None  # Token is revoked
                
            return payload
        except jwt.ExpiredSignatureError:
            return None  # Token expired
        except jwt.InvalidTokenError:
            return None  # Invalid token
            
    @staticmethod
    def logout(token):
        """Revoke a token."""
        try:
            # Decode token
            payload = jwt.decode(token, AuthService.JWT_SECRET, algorithms=[AuthService.JWT_ALGORITHM])
            
            # Get token data
            jti = payload.get('jti')
            token_type = payload.get('type')
            user_id = payload.get('sub')
            exp = datetime.datetime.fromtimestamp(payload.get('exp'))
            
            # Add token to blocklist
            revoked_token = TokenBlocklist(
                jti=jti,
                token_type=token_type,
                user_id=user_id,
                expires_at=exp
            )
            
            db.session.add(revoked_token)
            db.session.commit()
            
            return {
                "status": "success",
                "message": "Token revoked successfully"
            }, 200
            
        except jwt.ExpiredSignatureError:
            return {
                "status": "error", 
                "message": "Token has already expired"
            }, 400
        except jwt.InvalidTokenError:
            return {
                "status": "error", 
                "message": "Invalid token"
            }, 400
        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "status": "error", 
                "message": f"Database error: {str(e)}"
            }, 500