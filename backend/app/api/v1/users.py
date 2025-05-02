from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.services.user_service import UserService

# User endpoints

@api_v1_bp.route("/users", methods=["GET"])
def get_users():
    """Get all users endpoint."""
    try:
        users = UserService.get_all_users()
        return jsonify({"status": "success", "data": users}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/users/", methods=["GET"])
def get_user(user_id):
    """Get a specific user endpoint."""
    try:
        user = UserService.get_user_by_id(user_id)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        return jsonify({"status": "success", "data": user}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/users", methods=["POST"])
def create_user():
    """Create user endpoint."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No input data provided"}), 400
        
        # Validate required fields
        required_fields = ["username", "email", "password"]
        for field in required_fields:
            if field not in data:
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
        
        # Create user
        user = UserService.create_user(
            username=data["username"],
            email=data["email"],
            password=data["password"]
        )
        
        return jsonify({"status": "success", "data": user}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/users/", methods=["PUT"])
def update_user(user_id):
    """Update user endpoint."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No input data provided"}), 400
        
        # Update user
        user = UserService.update_user(user_id, **data)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        return jsonify({"status": "success", "data": user}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/users/", methods=["DELETE"])
def delete_user(user_id):
    """Delete user endpoint."""
    try:
        result = UserService.delete_user(user_id)
        if not result:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        return jsonify({"status": "success", "message": "User deleted"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500