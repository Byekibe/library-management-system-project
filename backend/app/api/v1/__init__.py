from flask import Blueprint

api_v1_bp = Blueprint("api_v1", __name__)

# Import your route modules to register them
from app.api.v1 import users  # This ensures the routes in users.py get registered
from app.api.v1 import auth  # This ensures the routes in auth.py get registered
from app.api.v1 import book_routes  # This ensures the routes in book_routes.py get registered
from app.api.v1 import member_routes  # This ensures the routes in member_routes.py get registered
from app.api.v1 import transaction_routes  # This ensures the routes in transaction_routes.py get registered