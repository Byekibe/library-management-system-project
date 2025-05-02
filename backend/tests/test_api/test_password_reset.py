import pytest
import json
import re
import jwt
from unittest.mock import patch, MagicMock
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app.services.auth_service import AuthService

class TestPasswordReset:
    """Tests for password reset functionality."""

    @patch('smtplib.SMTP')
    def test_forgot_password(self, mock_smtp, client, app, init_database):
        """Test forgot password endpoint."""
        # Mock the environment variables
        with patch.dict('os.environ', {
            'EMAIL_USER': 'test@example.com',
            'EMAIL_PASSWORD': 'test_password',
            'BASE_SERVER_URL': 'http://localhost:5000'
        }):
            # Setup mock SMTP connection
            mock_connection = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_connection
            
            # Prepare request
            payload = {
                "email": "test1@example.com"  # Existing user from init_database
            }
            
            # Send request
            response = client.post(
                "/api/v1/auth/forgot-password",
                data=json.dumps(payload),
                content_type="application/json"
            )
            
            # Assert response
            data = json.loads(response.data)
            assert response.status_code == 200
            assert data["status"] == "success"
            assert "reset" in data["message"].lower()
            
            # Verify SMTP was called
            mock_connection.starttls.assert_called_once()
            mock_connection.login.assert_called_once_with('test@example.com', 'test_password')
            mock_connection.sendmail.assert_called_once()
            
            # Verify email contains reset URL
            send_args = mock_connection.sendmail.call_args[0]
            email_content = send_args[2]
            assert "reset your password" in email_content
            reset_url_match = re.search(r'(http://[^\s]+)', email_content)
            assert reset_url_match is not None
    
    def test_forgot_password_nonexistent_email(self, client):
        """Test forgot password with non-existent email."""
        # Mock the environment variables
        with patch.dict('os.environ', {
            'EMAIL_USER': 'test@example.com',
            'EMAIL_PASSWORD': 'test_password',
            'BASE_SERVER_URL': 'http://localhost:5000'
        }):
            # Mock SMTP to avoid sending actual emails
            with patch('smtplib.SMTP'):
                # Prepare request with non-existent email
                payload = {
                    "email": "nonexistent@example.com"
                }
                
                # Send request
                response = client.post(
                    "/api/v1/auth/forgot-password",
                    data=json.dumps(payload),
                    content_type="application/json"
                )
                
                # Assert response - should still be successful for security reasons
                data = json.loads(response.data)
                assert response.status_code == 200
                assert data["status"] == "success"
                assert "If the email exists" in data["message"]

    def test_reset_password(self, client, app, init_database):
        """Test password reset endpoint."""
        with app.app_context():
            # Get user from init_database
            user = User.query.filter_by(email="test1@example.com").first()
            
            # Generate reset token
            reset_token = AuthService.generate_password_reset_token(user.id)
            
            # Original password hash
            original_hash = user.password_hash
            
            # Prepare request
            payload = {
                "reset_token": reset_token,
                "new_password": "new_secure_password"
            }
            
            # Send request
            response = client.post(
                "/api/v1/auth/reset-password",
                data=json.dumps(payload),
                content_type="application/json"
            )
            
            # Assert response
            data = json.loads(response.data)
            assert response.status_code == 200
            assert data["status"] == "success"
            
            # Reload user to check password hash
            user = User.query.get(user.id)
            assert user.password_hash != original_hash
            
            # Verify can login with new password
            login_payload = {
                "email": "test1@example.com",
                "password": "new_secure_password"
            }
            
            login_response = client.post(
                "/api/v1/auth/login",
                data=json.dumps(login_payload),
                content_type="application/json"
            )
            
            login_data = json.loads(login_response.data)
            assert login_response.status_code == 200
            assert login_data["status"] == "success"
    
    def test_reset_password_invalid_token(self, client):
        """Test password reset with invalid token."""
        # Prepare request with invalid token
        payload = {
            "reset_token": "invalid.token.here",
            "new_password": "new_secure_password"
        }
        
        # Send request
        response = client.post(
            "/api/v1/auth/reset-password",
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        # Assert response
        data = json.loads(response.data)
        assert response.status_code == 401
        assert data["status"] == "error"
        assert "Invalid" in data["message"]