from datetime import datetime
from app.extensions import db

class TokenBlocklist(db.Model):
    """Model for storing revoked tokens."""
    __tablename__ = "token_blocklist"
    
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True)
    token_type = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    revoked_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    def __repr__(self):
        return f"<TokenBlocklist {self.jti}>"
    
    @classmethod
    def is_token_revoked(cls, jti):
        """Check if a token is in the blocklist."""
        return cls.query.filter_by(jti=jti).first() is not None