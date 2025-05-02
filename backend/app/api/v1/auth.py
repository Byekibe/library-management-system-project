from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.services.auth_service import AuthService
from functools import wraps
import os

# Authentication middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({"status": "error", "message": "Token is missing"}), 401
        
        # Validate token
        payload = AuthService.validate_token(token)
        if not payload:
            return jsonify({"status": "error", "message": "Invalid or expired token"}), 401
        
        # Check token type
        if payload.get('type') != 'access':
            return jsonify({"status": "error", "message": "Invalid token type"}), 401
        
        # Add user_id to request
        request.user_id = payload.get('sub')
        
        return f(*args, **kwargs)
    
    return decorated

# Auth endpoints
@api_v1_bp.route("/auth/register", methods=["POST"])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
        
        # Register user
        response, status_code = AuthService.register(
            username=data['username'],
            email=data['email'],
            password=data['password']
        )
        
        return jsonify(response), status_code
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/auth/login", methods=["POST"])
def login():
    """Login a user."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
        
        # Login user
        response, status_code = AuthService.login(
            email=data['email'],
            password=data['password']
        )
        
        return jsonify(response), status_code
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/auth/refresh", methods=["POST"])
def refresh():
    """Refresh access token."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'refresh_token' not in data:
            return jsonify({"status": "error", "message": "Missing refresh token"}), 400
        
        # Refresh token
        response, status_code = AuthService.refresh_token(data['refresh_token'])
        
        return jsonify(response), status_code
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    """Initiate forgot password process."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'email' not in data:
            return jsonify({"status": "error", "message": "Missing email"}), 400
        
        # Process forgot password
        response, status_code = AuthService.forgot_password(data['email'])
        
        return jsonify(response), status_code
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/auth/reset-password", methods=["POST"])
def reset_password():
    """Reset password using reset token."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['reset_token', 'new_password']
        for field in required_fields:
            if field not in data:
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
        
        # Reset password
        response, status_code = AuthService.reset_password(
            reset_token=data['reset_token'],
            new_password=data['new_password']
        )
        
        return jsonify(response), status_code
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/auth/reset-password/<token>", methods=["GET"])
def reset_password_form(token):
    """Render reset password form."""
    # This route is for handling the link in the email
    # In a real application, this would render a password reset form
    # For API-only applications, this might redirect to a frontend URL
    
    # Validate token first
    payload = AuthService.validate_token(token)
    if not payload or payload.get('type') != 'reset':
        return jsonify({"status": "error", "message": "Invalid or expired reset token"}), 401
    
    # For API-only backend, redirect to frontend
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    return jsonify({
        "status": "success",
        "message": "Token is valid. Please set your new password.",
        "reset_url": f"{frontend_url}/reset-password?token={token}"
    }), 200

@api_v1_bp.route("/auth/logout", methods=["POST"])
@token_required
def logout():
    """Logout a user by revoking their token."""
    # Get token from headers
    auth_header = request.headers.get('Authorization')
    token = auth_header.split(' ')[1] if auth_header else None
    
    if not token:
        return jsonify({"status": "error", "message": "Token is missing"}), 401
    
    # Revoke token
    response, status_code = AuthService.logout(token)
    return jsonify(response), status_code

# Protected route example
@api_v1_bp.route("/auth/me", methods=["GET"])
@token_required
def get_me():
    """Get current user info."""
    from app.models.user import User
    
    try:
        user = User.query.get(request.user_id)
        
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        return jsonify({
            "status": "success",
            "data": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500