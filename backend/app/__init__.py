import os
from flask import Flask, g, send_from_directory, render_template
from app.extensions import db, cors
from config import config
from sqlalchemy.exc import InvalidRequestError
from flask_migrate import Migrate

# Initialize Flask-Migrate
migrate = Migrate()

def create_app(config_name="default"):
    app = Flask(__name__, static_folder="./static", template_folder="./templates")
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize CORS
    cors.init_app(app, supports_credentials=True)

    # Register extensions (such as db)
    register_extensions(app)

    # Register before_request hook
    @app.before_request
    def detect_db_dialect():
        try:
            bind = db.session.get_bind()
            if bind:
                g.db_dialect = bind.dialect.name
            else:
                g.db_dialect = None
        except InvalidRequestError:
            g.db_dialect = None

    # Add catch-all route for serving frontend
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return render_template('index.html')

    # Register blueprints
    register_blueprints(app)

    return app


def register_extensions(app):
    """Register Flask extensions."""
    db.init_app(app)
    migrate.init_app(app, db)

    # Avoid auto-creating tables on every app start in production
    # Only use db.create_all() in development, not in production.
    if not app.config["DEBUG"]:
        with app.app_context():
            db.create_all()  # This is fine in dev, but prefer migrations in production

def register_blueprints(app):
    """Register blueprints for your app."""
    from app.api import api_bp  # Ensure your blueprint is correctly imported
    app.register_blueprint(api_bp, url_prefix="/api")
    # Register other blueprints as needed