# app/api/v1/book_routes.py

from flask import request, jsonify
from app.api.v1 import api_v1_bp # Import the shared blueprint
from app.services import BookService # Assuming your BookService is here

# Book endpoints

@api_v1_bp.route("/books", methods=["POST"])
def create_book():
    """Create a new book."""
    data = request.get_json()
    title = data.get('title')
    author = data.get('author')
    total_stock = data.get('total_stock')
    isbn = data.get('isbn') # Optional field

    if not title or not author or total_stock is None:
        return jsonify({"status": "error", "message": "Missing required fields: title, author, total_stock"}), 400

    try:
        # Ensure total_stock is an integer and non-negative
        total_stock = int(total_stock)
        if total_stock < 0:
             return jsonify({"status": "error", "message": "total_stock cannot be negative"}), 400
    except ValueError:
        return jsonify({"status": "error", "message": "total_stock must be an integer"}), 400

    book_id = BookService.create_book(title, author, total_stock, isbn)

    if book_id:
        # Fetch the created book to return in the response
        created_book = BookService.get_book(book_id)
        return jsonify({"status": "success", "data": created_book}), 201 # 201 Created
    else:
        # Service returns None on database error
        return jsonify({"status": "error", "message": "Failed to create book"}), 500


@api_v1_bp.route("/books", methods=["GET"])
def get_all_books():
    """Get all books."""
    try:
        books = BookService.get_all_books()
        return jsonify({"status": "success", "data": books}), 200
    except Exception as e:
        # Catch any unexpected errors from the service
        return jsonify({"status": "error", "message": str(e)}), 500


@api_v1_bp.route("/books/<int:book_id>", methods=["GET"])
def get_book(book_id):
    """Get a specific book by ID."""
    try:
        book = BookService.get_book(book_id)
        if book:
            return jsonify({"status": "success", "data": book}), 200
        else:
            return jsonify({"status": "error", "message": "Book not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@api_v1_bp.route("/books/<int:book_id>", methods=[
"PUT"])
def update_book(book_id):
    """Update a book record."""
    data = request.get_json()
    if not data:
         return jsonify({"status": "error", "message": "No update data provided"}), 400

    # You might want more specific validation here depending on allowed fields
    # Ensure total_stock is int if present
    if 'total_stock' in data:
        try:
            data['total_stock'] = int(data['total_stock'])
            if data['total_stock'] < 0:
                 return jsonify({"status": "error", "message": "total_stock cannot be negative"}), 400
        except ValueError:
             return jsonify({"status": "error", "message": "total_stock must be an integer"}), 400


    success = BookService.update_book(book_id, data) # Assuming update_book handles which fields to update

    if success:
        # Fetch the updated book to return
        updated_book = BookService.get_book(book_id)
        if updated_book:
             return jsonify({"status": "success", "data": updated_book}), 200
        else:
             # Should not happen if update was successful but book vanished
             return jsonify({"status": "error", "message": "Book updated but could not be retrieved"}), 500
    else:
        # The service layer should ideally provide a more specific reason for failure
        # e.g., book not found, or cannot update stock due to issued books
        # For simplicity here, returning a generic 400 or 404
        book_exists = BookService.get_book(book_id)
        if not book_exists:
            return jsonify({"status": "error", "message": "Book not found"}), 404
        else:
            # Assume failure is due to business logic (e.g., trying to reduce stock below issued)
            return jsonify({"status": "error", "message": "Failed to update book. Check for issued copies or invalid data."}), 400


@api_v1_bp.route("/books/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    """Delete a book."""
    success = BookService.delete_book(book_id) # Assuming delete_book handles the check for issued copies

    if success:
        return jsonify({"status": "success", "message": "Book deleted successfully"}), 200
    else:
        # Service returns False if issued copies exist or book not found
        book_exists = BookService.get_book(book_id)
        if not book_exists:
            return jsonify({"status": "error", "message": "Book not found"}), 404
        else:
            # If it exists but couldn't be deleted, it's likely due to issued copies
            return jsonify({"status": "error", "message": "Cannot delete book: Copies are currently issued."}), 400 # Bad Request


@api_v1_bp.route("/books/search", methods=["GET"])
def search_books():
    """Search for books by title or author."""
    query = request.args.get('q')
    if not query:
        return jsonify({"status": "error", "message": "Missing search query parameter 'q'"}), 400

    try:
        books = BookService.search_books(query)
        return jsonify({"status": "success", "data": books}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500