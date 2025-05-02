# app/api/v1/transaction_routes.py

from flask import request, jsonify
from app.api.v1 import api_v1_bp # Import the shared blueprint
from app.services import TransactionService # Assuming your TransactionService is here

# Transaction endpoints

@api_v1_bp.route("/transactions/issue", methods=["POST"])
def issue_book():
    """Issue a book to a member."""
    data = request.get_json()
    book_id = data.get('book_id')
    member_id = data.get('member_id')

    if not book_id or not member_id:
        return jsonify({"status": "error", "message": "Missing book_id or member_id"}), 400

    # Assuming service returns (success_boolean, message_string)
    success, message = TransactionService.issue_book(book_id, member_id)

    if success:
        return jsonify({"status": "success", "message": message}), 201 # 201 Created
    else:
        # Service message contains the reason for failure (book unavailable, debt limit, not found)
        status_code = 400 # Default bad request
        if "not found" in message:
            status_code = 404
        elif "not available" in message or "debt" in message:
             status_code = 400 # Business logic constraint
        else:
             status_code = 500 # Unexpected error

        return jsonify({"status": "error", "message": message}), status_code


@api_v1_bp.route("/transactions/return/<int:transaction_id>", methods=["POST"]) # Using POST as it changes state
def return_book(transaction_id):
    """Process the return of a book transaction."""

    # Assuming service returns (success_boolean, message_string)
    success, message = TransactionService.return_book(transaction_id)

    if success:
        return jsonify({"status": "success", "message": message}), 200
    else:
        # Service message contains the reason for failure (not found, already returned)
        status_code = 400 # Default bad request
        if "not found" in message:
            status_code = 404
        elif "already returned" in message:
             status_code = 400 # Bad request due to state
        else:
             status_code = 500 # Unexpected error

        return jsonify({"status": "error", "message": message}), status_code

# Optional: Get all transactions, or filter in different ways

@api_v1_bp.route("/transactions", methods=["GET"])
def get_all_transactions():
    """Get all transactions."""
    # You might want pagination or filtering for a large number of transactions
    try:
        transactions = TransactionService.get_all_transactions() # You'll need to add this method to TransactionService
        return jsonify({"status": "success", "data": transactions}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/transactions/member/<int:member_id>", methods=["GET"])
def get_transactions_by_member(member_id):
    """Get transactions for a specific member."""
    try:
        transactions = TransactionService.get_transactions_by_member(member_id)
        # Service returns list (empty if none), handle potential None if get_member fails within service
        if transactions is not None:
             return jsonify({"status": "success", "data": transactions}), 200
        else:
            # This case might be hit if the member ID is invalid and the service checks this
             return jsonify({"status": "error", "message": "Could not retrieve transactions, check member ID"}), 404 # Or 500 if it's a db error
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@api_v1_bp.route("/transactions/open/member/<int:member_id>", methods=["GET"])
def get_open_transactions_by_member(member_id):
    """Get open (not returned) transactions for a specific member."""
    try:
        transactions = TransactionService.get_open_transactions_by_member(member_id)
        if transactions is not None:
             return jsonify({"status": "success", "data": transactions}), 200
        else:
             return jsonify({"status": "error", "message": "Could not retrieve transactions, check member ID"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500