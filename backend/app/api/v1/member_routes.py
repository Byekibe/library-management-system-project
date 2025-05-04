# app/api/v1/member_routes.py

from flask import request, jsonify
from app.api.v1 import api_v1_bp # Import the shared blueprint
from app.services import MemberService # Assuming your MemberService is here

# Member endpoints

@api_v1_bp.route("/members", methods=["POST"])
def create_member():
    """Create a new member."""
    data = request.get_json()
    name = data.get('name')
    email = data.get('email') # Optional
    phone = data.get('phone') # Optional

    if not name:
        return jsonify({"status": "error", "message": "Missing required field: name"}), 400

    member_id = MemberService.create_member(name, email, phone)
    print(member_id)

    if member_id:
        # Fetch the created member to return
        created_member = MemberService.get_member(member_id)
        print(f"Created member: {created_member}")
        return jsonify({"status": "success", "data": created_member}), 201 # 201 Created
    else:
        # Service returns None on database error or if email unique constraint fails
        return jsonify({"status": "error", "message": "Failed to create member. Email might already exist."}), 500 # Or 409 Conflict for email


@api_v1_bp.route("/members", methods=["GET"])
def get_all_members():
    """Get all members."""
    try:
        members = MemberService.get_all_members()
        return jsonify({"status": "success", "data": members}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@api_v1_bp.route("/members/<int:member_id>", methods=["GET"])
def get_member(member_id):
    """Get a specific member by ID."""
    try:
        member = MemberService.get_member(member_id)
        if member:
            return jsonify({"status": "success", "data": member}), 200
        else:
            return jsonify({"status": "error", "message": "Member not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@api_v1_bp.route("/members/<int:member_id>", methods=["PUT"])
def update_member(member_id):
    """Update a member record."""
    data = request.get_json()
    if not data:
         return jsonify({"status": "error", "message": "No update data provided"}), 400

    # Service handles which fields to update
    success = MemberService.update_member(member_id, data)

    if success:
        # Fetch the updated member to return
        updated_member = MemberService.get_member(member_id)
        if updated_member:
             return jsonify({"status": "success", "data": updated_member}), 200
        else:
             return jsonify({"status": "error", "message": "Member updated but could not be retrieved"}), 500
    else:
        # Assume failure is due to member not found or invalid data
        member_exists = MemberService.get_member(member_id)
        if not member_exists:
            return jsonify({"status": "error", "message": "Member not found"}), 404
        else:
             # Could also be due to email unique constraint violation
             return jsonify({"status": "error", "message": "Failed to update member. Email might already exist or invalid data."}), 400 # Or 409 Conflict


@api_v1_bp.route("/members/<int:member_id>", methods=["DELETE"])
def delete_member(member_id):
    """Delete a member."""
    # Assuming delete_member in service handles checking debt and open transactions
    success = MemberService.delete_member(member_id)

    if success:
        return jsonify({"status": "success", "message": "Member deleted successfully"}), 200
    else:
        # Service returns False if debt exists or open transactions exist, or member not found
        member = MemberService.get_member(member_id)
        if not member:
             return jsonify({"status": "error", "message": "Member not found"}), 404
        elif member.get('outstanding_debt', 0) > 0:
             return jsonify({"status": "error", "message": f"Cannot delete member: Outstanding debt is KES {member['outstanding_debt']}."}), 400
        else:
             # Assume open transactions or other unexpected issue
             return jsonify({"status": "error", "message": "Cannot delete member: Has open transactions or other issues."}), 400 # Bad Request

@api_v1_bp.route("/members/<int:member_id>/debt", methods=["GET"])
def get_member_debt(member_id):
    """Get a member's outstanding debt."""
    try:
        debt = MemberService.get_member_debt(member_id)
        if debt is not None: # get_member_debt returns None if member not found
             return jsonify({"status": "success", "data": {"member_id": member_id, "outstanding_debt": float(debt)}}), 200
        else:
             return jsonify({"status": "error", "message": "Member not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    

@api_v1_bp.route("/members/<int:member_id>/payment", methods=["POST"])
def record_member_payment(member_id):
    """
    Records a payment for a member, reducing their outstanding debt.
    Expects JSON body with 'amount': float.
    """
    # Ensure the request body is JSON
    if not request.is_json:
        return jsonify({"status": "error", "message": "Request must be JSON"}), 415 # Unsupported Media Type

    data = request.get_json()
    amount = data.get("amount")

    # Basic validation for the presence and type of amount
    if amount is None:
        return jsonify({"status": "error", "message": "'amount' is required in the request body"}), 400
    try:
        # Convert amount to float and validate it's a number
        amount = float(amount)
    except (ValueError, TypeError):
         return jsonify({"status": "error", "message": "'amount' must be a valid number"}), 400

    # Call the service method to record the payment
    success, message = MemberService.record_payment(member_id, amount)

    if success:
        # On success, return a 200 OK response with the success message
        return jsonify({"status": "success", "message": message}), 200
    else:
        # On failure, determine the appropriate status code based on the message
        # If the message indicates a client-side issue (like invalid amount or member not found), use 4xx
        # Otherwise, default to 500 for server-side errors
        status_code = 400 # Default to Bad Request for client-side issues
        if "Member with ID" in message and "not found" in message:
             status_code = 404 # Not Found if member doesn't exist
        elif "positive" in message and "amount" in message:
             status_code = 400 # Bad Request for invalid amount
        else:
             status_code = 500 # Internal Server Error for unexpected issues

        return jsonify({"status": "error", "message": message}), status_code