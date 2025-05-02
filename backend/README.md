# Flask API Project

A robust Flask RESTful API application with a clear separation of concerns, using SQLAlchemy for database operations with support for both ORM and raw SQL.

## Features

- Flask factory pattern for flexible application configuration
- Clear separation between models, services, and API endpoints
- SQLAlchemy integration with support for both ORM and raw SQL
- API versioning with blueprints
- Environment-specific configurations
- Testing setup with pytest

## Project Structure

```
my_flask_api/
├── .env                    # Environment variables for development
├── .gitignore              # Git ignore file
├── config.py               # Configuration settings
├── requirements.txt        # Project dependencies
├── run.py                  # Application entry point
├── tests/                  # Test directory
└── app/                    # Application package
    ├── models/             # Database models
    ├── services/           # Business logic layer
    ├── api/                # API resources/endpoints
    └── utils/              # Utility functions
```

## Getting Started

### Prerequisites

- Python 3.8+
- pip (Python package installer)
- PostgreSQL or MySQL database (recommended)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd my_flask_api
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file to set your database URL and other configuration options.

5. Initialize the database:
   ```
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

### Running the Application

Start the development server:
```
python run.py
```
or
```
flask run
```

The API will be available at `http://localhost:5000`.

## API Endpoints

### Users Resource

- `GET /api/v1/users` - Retrieve all users
- `GET /api/v1/users/<id>` - Retrieve a specific user
- `POST /api/v1/users` - Create a new user
- `PUT /api/v1/users/<id>` - Update a user
- `DELETE /api/v1/users/<id>` - Delete a user

### Request & Response Examples

#### Get all users

```
GET /api/v1/users
```

Response:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "username": "user1",
      "email": "user1@example.com",
      "created_at": "2025-04-14T12:00:00",
      "is_active": true
    },
    {
      "id": 2,
      "username": "user2",
      "email": "user2@example.com",
      "created_at": "2025-04-14T12:30:00",
      "is_active": true
    }
  ]
}
```

#### Create a new user

```
POST /api/v1/users
Content-Type: application/json

{
  "username": "new_user",
  "email": "new_user@example.com",
  "password": "secure_password"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": 3,
    "username": "new_user",
    "email": "new_user@example.com",
    "created_at": "2025-04-14T13:00:00",
    "is_active": true
  }
}
```

## Testing

Run the test suite:
```
pytest
```

For test coverage:
```
pytest --cov=app tests/
```

## Database Configuration

The application supports both PostgreSQL and MySQL. Choose the one that best fits your needs:

### PostgreSQL (Recommended)
- Better for complex queries and data models
- Advanced features like JSON support
- Stronger data integrity

Update `.env` with:
```
DATABASE_URL=postgresql://username:password@localhost/dbname
```

### MySQL
- Simple to set up for smaller applications
- Good for read-heavy workloads
- Common in shared hosting

Update `.env` with:
```
DATABASE_URL=mysql+pymysql://username:password@localhost/dbname
```

## Development Guidelines

### Using ORM vs Raw SQL

- **ORM**: Use for standard CRUD operations and when working with model relationships
- **Raw SQL**: Use for complex queries, performance-critical operations, or specific database features

Example in service layer:
```python
# Using ORM
user = User.query.get(user_id)

# Using Raw SQL
user = db.session.execute("SELECT * FROM users WHERE id = :id", {"id": user_id}).fetchone()
```

## Deployment

For production deployment:

1. Update `.env` with production settings:
   ```
   FLASK_ENV=production
   DATABASE_URL=<production-db-url>
   SECRET_KEY=<secure-secret-key>
   ```

2. Run with a production WSGI server:
   ```
   gunicorn "app:create_app('production')" --bind 0.0.0.0:8000
   ```

## License

[MIT License](LICENSE)