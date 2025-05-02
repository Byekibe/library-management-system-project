import pytest
from app import create_app
from app.extensions import db
from app.models.user import User

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = create_app("testing")
    
    # Create application context
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create a CLI test runner for the app."""
    return app.test_cli_runner()

@pytest.fixture
def init_database(app):
    """Initialize the test database with sample data."""
    # Create test users
    user1 = User(username="test_user1", email="test1@example.com", password_hash="test_password")
    user2 = User(username="test_user2", email="test2@example.com", password_hash="test_password")
    
    db.session.add(user1)
    db.session.add(user2)
    db.session.commit()
    
    return {"user1": user1, "user2": user2}