import pytest
import json
import jwt
import os
from datetime import datetime, timedelta
from app.models.user import User
from app.services.auth_service import AuthService
from werkzeug.security import generate_password_hash
from app.extensions import db

class TestAuthAPI:
    """Tests for authentication API endpoints."""
    
    def test_register(self, client):
        """Test user registration."""
        # Prepare data
        payload = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepassword123"
        }
        
        # Send request
        response = client.post(
            "/api/v1/auth/register",
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        # Assert response
        data = json.loads(response.data)
        assert response.status_code == 201
        assert data["status"] == "success"
        assert "user" in data["data"]
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]
        assert data["data"]["user"]["username"] == "newuser"
        assert data["data"]["user"]["email"] == "newuser@example.com"
        
        # Check if user is actually in the database
        user = User.query.filter_by(email="newuser@example.com").first()
        assert user is not None
    
    def test_register_existing_user(self, client, init_database):
        """Test registering with an existing username/email."""
        # Prepare data
        payload = {
            "username": "test_user1",  # Username that already exists
            "email": "new@example.com",
            "password": "securepassword123"
        }
        
        # Send request
        response = client.post(
            "/api/v1/auth/register",
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        # Assert response
        data = json.loads(response.data)
        assert response.status_code == 400
        assert data["status"] == "error"
        assert "already exists" in data["message"]
    
    def test_login_success(self, client, init_database, app):
        """Test successful login."""
        # Update the user's password hash
        with app.app_context():
            user = User.query.filter_by(username="test_user1").first()
            user.password_hash = generate_password_hash("correct_password")
            # db = app.extensions['sqlalchemy'].db
            db.session.commit()
        
        # Prepare data
        payload = {
            "email": "test1@example.com",
            "password": "correct_password"
        }
        
        # Send request
        response = client.post(
            "/api/v1/auth/login",
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        # Assert response
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["status"] == "success"
        assert "user" in data["data"]
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]
    
    def test_login_invalid_credentials(self, client, init_database, app):
        """Test login with invalid credentials."""
        # Update the user's password hash
        with app.app_context():
            user = User.query.filter_by(username="test_user1").first()
            user.password_hash = generate_password_hash("correct_password")
            # db = app.extensions['sqlalchemy'].db
            db.session.commit()
        
        # Prepare data with wrong password
        payload = {
            "email": "test1@example.com",
            "password": "wrong_password"
        }
        
        # Send request
        response = client.post(
            "/api/v1/auth/login",
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        # Assert response
        data = json.loads(response.data)
        assert response.status_code == 401
        assert data["status"] == "error"
        assert "Invalid credentials" in data["message"]
    
    def test_refresh_token(self, client, app):
        """Test refresh token endpoint."""
        # Create a user and generate a refresh token
        with app.app_context():
            # Add a user
            user = User(
                username="refresh_user",
                email="refresh@example.com",
                password_hash=generate_password_hash("password123")
            )
            # db = app.extensions['sqlalchemy'].db
            db.session.add(user)
            db.session.commit()
            
            # Generate refresh token
            refresh_token = AuthService.generate_refresh_token(user.id)
        
        # Prepare data
        payload = {
            "refresh_token": refresh_token
        }
        
        # Send request
        response = client.post(
            "/api/v1/auth/refresh",
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        # Assert response
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["status"] == "success"
        assert "access_token" in data["data"]
    
    def test_protected_route_with_valid_token(self, client, app):
        """Test accessing a protected route with a valid token."""
        # Create a user and generate an access token
        with app.app_context():
            # Add a user
            user = User(
                username="protected_user",
                email="protected@example.com",
                password_hash=generate_password_hash("password123")
            )
            # db = app.extensions['sqlalchemy'].db
            db.session.add(user)
            db.session.commit()
            
            # Generate access token
            access_token = AuthService.generate_access_token(user.id)
        
        # Send request to protected endpoint
        response = client.get(
            "/api/v1/auth/me",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )
        
        # Assert response
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["status"] == "success"
        assert data["data"]["username"] == "protected_user"
    
    def test_protected_route_without_token(self, client):
        """Test accessing a protected route without a token."""
        # Send request to protected endpoint without token
        response = client.get("/api/v1/auth/me")
        
        # Assert response
        data = json.loads(response.data)
        assert response.status_code == 401
        assert data["status"] == "error"
        assert "Token is missing" in data["message"]
    
    def test_logout(self, client, app):
        """Test logout endpoint."""
        # Create a user and generate an access token
        with app.app_context():
            # Add a user
            user = User(
                username="logout_user",
                email="logout@example.com",
                password_hash=generate_password_hash("password123")
            )
            # db = app.extensions['sqlalchemy'].db
            db.session.add(user)
            db.session.commit()
            
            # Generate access token
            access_token = AuthService.generate_access_token(user.id)
        
        # Send logout request
        response = client.post(
            "/api/v1/auth/logout",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )
        
        # Assert response
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["status"] == "success"
        
        # Try to access a protected route with the same token
        response = client.get(
            "/api/v1/auth/me",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )
        
        # Token should be invalid now
        data = json.loads(response.data)
        assert response.status_code == 401
        assert data["status"] == "error"